const REPOSITORY = "ppastorin/london-advanced-site";
const BRANCH = "main";
const DESTINATION_ROOT = "assets/instagram";
const MAX_FILE_BYTES = 24 * 1024 * 1024;
const LARGE_BATCH_BYTES = 500 * 1024 * 1024;
const PREVIEW_LIMIT = 120;
const WRITE_INTERVAL_MS = 850;
const ALLOWED_EXTENSIONS = new Set(["jpg", "jpeg", "png", "webp", "gif", "avif"]);
let lastWriteAt = 0;

export function normaliseRelativePath(value) {
  const parts = String(value || "")
    .replaceAll("\\", "/")
    .split("/")
    .map(part => part.trim())
    .filter(part => part && part !== ".");
  if (!parts.length || parts.some(part => part === ".." || /[\u0000-\u001f]/.test(part))) return "";
  return parts.join("/");
}

export function folderAdjustedPath(value, removeOuterFolder) {
  const path = normaliseRelativePath(value);
  if (!path) return "";
  const parts = path.split("/");
  return removeOuterFolder && parts.length > 1 ? parts.slice(1).join("/") : path;
}

export function shouldRemoveOuterFolder(paths) {
  const parts = paths.map(normaliseRelativePath).filter(Boolean).map(path => path.split("/"));
  return parts.length > 0 && parts.every(part => part.length >= 3 && part[0] === parts[0][0]);
}

export function buildTargetPath(relativePath) {
  const path = normaliseRelativePath(relativePath);
  return path ? `${DESTINATION_ROOT}/${path}` : "";
}

export function deploymentPaths(targetPath) {
  const path = normaliseRelativePath(targetPath);
  return path ? [path, `dist/${path}`] : [];
}

export function isSupportedImage(filename) {
  const extension = String(filename || "").split(".").pop().toLowerCase();
  return ALLOWED_EXTENSIONS.has(extension);
}

export function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 ** 2) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 ** 2).toFixed(bytes >= 100 * 1024 ** 2 ? 0 : 1)} MB`;
}

export function prepareBatch(files) {
  const candidates = [...files].map(file => ({
    file,
    sourcePath: normaliseRelativePath(file.webkitRelativePath || file.name)
  }));
  const removeOuterFolder = shouldRemoveOuterFolder(candidates.map(item => item.sourcePath));
  const accepted = [];
  const rejected = [];
  for (const candidate of candidates) {
    const relativePath = folderAdjustedPath(candidate.sourcePath, removeOuterFolder);
    const targetPath = buildTargetPath(relativePath);
    let reason = "";
    if (!candidate.sourcePath || !targetPath) reason = "invalid path";
    else if (candidate.sourcePath.split("/").some(part => part.startsWith("."))) reason = "hidden/system file";
    else if (!isSupportedImage(candidate.file.name)) reason = "unsupported image type";
    else if (candidate.file.size > MAX_FILE_BYTES) reason = `larger than ${formatBytes(MAX_FILE_BYTES)}`;
    else if (!candidate.file.size) reason = "empty file";
    if (reason) rejected.push({ name: candidate.sourcePath || candidate.file.name, reason });
    else accepted.push({ file: candidate.file, relativePath, targetPath });
  }
  return { accepted, rejected, removeOuterFolder };
}

function apiHeaders(token) {
  return {
    Accept: "application/vnd.github+json",
    Authorization: `Bearer ${token}`,
    "X-GitHub-Api-Version": "2022-11-28"
  };
}

async function githubRequest(token, pathname, options = {}) {
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const response = await fetch(`https://api.github.com${pathname}`, {
      ...options,
      headers: { ...apiHeaders(token), ...(options.headers || {}) }
    });
    if (response.ok) return response.status === 204 ? null : response.json();
    const payload = await response.json().catch(() => ({}));
    const retryAfter = Number(response.headers.get("Retry-After") || 0);
    const rateLimited = (response.status === 403 || response.status === 429) && (retryAfter || response.headers.get("X-RateLimit-Remaining") === "0");
    if (rateLimited && attempt < 2) {
      await new Promise(resolve => setTimeout(resolve, Math.max(retryAfter * 1000, (attempt + 1) * 5000)));
      continue;
    }
    const error = new Error(payload.message || `GitHub request failed (${response.status})`);
    error.status = response.status;
    throw error;
  }
}

async function createBlob(token, content) {
  const delay = Math.max(0, WRITE_INTERVAL_MS - (Date.now() - lastWriteAt));
  if (delay) await new Promise(resolve => setTimeout(resolve, delay));
  lastWriteAt = Date.now();
  return githubRequest(token, `/repos/${REPOSITORY}/git/blobs`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ content, encoding: "base64" })
  });
}

async function fileToBase64(file) {
  const bytes = new Uint8Array(await file.arrayBuffer());
  const chunkSize = 32_768;
  let binary = "";
  for (let offset = 0; offset < bytes.length; offset += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(offset, offset + chunkSize));
  }
  return btoa(binary);
}

async function mapWithConcurrency(items, concurrency, task) {
  const results = new Array(items.length);
  let cursor = 0;
  async function worker() {
    while (cursor < items.length) {
      const index = cursor++;
      results[index] = await task(items[index], index);
    }
  }
  await Promise.all(Array.from({ length: Math.min(concurrency, items.length) }, worker));
  return results;
}

async function currentBranch(token) {
  const reference = await githubRequest(token, `/repos/${REPOSITORY}/git/ref/heads/${BRANCH}`);
  const commit = await githubRequest(token, `/repos/${REPOSITORY}/git/commits/${reference.object.sha}`);
  return { commitSha: reference.object.sha, treeSha: commit.tree.sha };
}

async function repositoryPaths(token, treeSha) {
  const tree = await githubRequest(token, `/repos/${REPOSITORY}/git/trees/${treeSha}?recursive=1`);
  if (tree.truncated) throw new Error("The repository file list was truncated. No files were changed; try again later.");
  return new Set(tree.tree.filter(item => item.type === "blob").map(item => item.path));
}

async function verifyAccess(token) {
  const [user, repository] = await Promise.all([
    githubRequest(token, "/user"),
    githubRequest(token, `/repos/${REPOSITORY}`)
  ]);
  if (!repository.permissions?.push) throw new Error("This GitHub account does not have permission to update London Advanced.");
  return user.login;
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"]/g, character => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[character]);
}

function initialise() {
  const elements = Object.fromEntries([
    "folder-input", "clear-selection", "file-count", "folder-count", "total-size", "selection-warning",
    "rejections", "file-preview", "allow-overwrite", "commit-message", "connect-github", "start-upload",
    "auth-state", "progress-wrap", "progress-label", "progress-count", "upload-progress", "result"
  ].map(id => [id, document.getElementById(id)]));
  const queue = new Map();
  let token = sessionStorage.getItem("la_media_github_token") || "";
  let githubLogin = "";
  let busy = false;

  function setStep(step) {
    document.querySelectorAll("[data-step-marker]").forEach(item => {
      item.classList.toggle("is-current", Number(item.dataset.stepMarker) === step);
    });
  }

  function setResult(message, error = false) {
    elements.result.hidden = false;
    elements.result.classList.toggle("is-error", error);
    elements.result.innerHTML = message;
  }

  function updateUploadButton() {
    elements["start-upload"].disabled = busy || !token || queue.size === 0;
    elements["clear-selection"].disabled = busy || queue.size === 0;
    elements["folder-input"].disabled = busy;
    elements["connect-github"].disabled = busy;
  }

  function renderQueue() {
    const entries = [...queue.values()].sort((a, b) => a.targetPath.localeCompare(b.targetPath));
    const folders = new Set(entries.map(entry => entry.relativePath.split("/").slice(0, -1).join("/") || "(root)"));
    const totalBytes = entries.reduce((sum, entry) => sum + entry.file.size, 0);
    elements["file-count"].textContent = entries.length.toLocaleString("en-GB");
    elements["folder-count"].textContent = folders.size.toLocaleString("en-GB");
    elements["total-size"].textContent = formatBytes(totalBytes);
    elements["selection-warning"].hidden = totalBytes <= LARGE_BATCH_BYTES;
    elements["selection-warning"].textContent = totalBytes > LARGE_BATCH_BYTES
      ? `This batch is ${formatBytes(totalBytes)}. Uploading will work, but optimising the source images first will make the website repository and deploy much lighter.`
      : "";
    if (!entries.length) {
      elements["file-preview"].innerHTML = '<p class="empty-state">Choose a folder to preview its files.</p>';
    } else {
      const visible = entries.slice(0, PREVIEW_LIMIT);
      elements["file-preview"].innerHTML = visible.map(entry =>
        `<div class="file-row"><code>${escapeHtml(entry.targetPath)}</code><span>${formatBytes(entry.file.size)}</span></div>`
      ).join("") + (entries.length > PREVIEW_LIMIT
        ? `<p class="more-files">Plus ${(entries.length - PREVIEW_LIMIT).toLocaleString("en-GB")} more files in this batch.</p>`
        : "");
      setStep(2);
    }
    updateUploadButton();
  }

  function addFiles(fileList) {
    const batch = prepareBatch(fileList);
    for (const entry of batch.accepted) queue.set(entry.targetPath, entry);
    elements.rejections.hidden = batch.rejected.length === 0;
    elements.rejections.innerHTML = batch.rejected.length
      ? `<strong>${batch.rejected.length} file${batch.rejected.length === 1 ? " was" : "s were"} not added.</strong> ${escapeHtml(batch.rejected.slice(0, 5).map(item => `${item.name} (${item.reason})`).join(", "))}${batch.rejected.length > 5 ? "…" : ""}`
      : "";
    renderQueue();
  }

  async function connect() {
    const popup = window.open("/api/decap/auth?provider=github", "la-media-github", "width=720,height=760");
    if (!popup) setResult("The sign-in window was blocked. Allow pop-ups for this site, then try again.", true);
  }

  async function acceptToken(nextToken) {
    token = nextToken;
    sessionStorage.setItem("la_media_github_token", token);
    elements["auth-state"].textContent = "Checking access…";
    try {
      githubLogin = await verifyAccess(token);
      elements["auth-state"].textContent = `Connected as ${githubLogin}`;
      elements["auth-state"].classList.add("is-connected");
      elements["connect-github"].textContent = "Reconnect GitHub";
      setStep(queue.size ? 3 : 1);
      elements.result.hidden = true;
    } catch (error) {
      token = "";
      sessionStorage.removeItem("la_media_github_token");
      elements["auth-state"].textContent = "Not connected";
      elements["auth-state"].classList.remove("is-connected");
      setResult(escapeHtml(error.message), true);
    }
    updateUploadButton();
  }

  async function upload() {
    if (busy || !token || !queue.size) return;
    busy = true;
    updateUploadButton();
    elements.result.hidden = true;
    elements["progress-wrap"].hidden = false;
    elements["upload-progress"].value = 0;
    const selected = [...queue.values()].sort((a, b) => a.targetPath.localeCompare(b.targetPath));
    try {
      elements["progress-label"].textContent = "Checking existing files…";
      elements["progress-count"].textContent = `0 / ${selected.length}`;
      let base = await currentBranch(token);
      const existing = await repositoryPaths(token, base.treeSha);
      const conflicts = selected.filter(entry => deploymentPaths(entry.targetPath).some(path => existing.has(path)));
      if (conflicts.length && !elements["allow-overwrite"].checked) {
        throw new Error(`${conflicts.length} selected path${conflicts.length === 1 ? " already exists" : "s already exist"}. Remove those files from the selection or tick “Replace files with matching paths”.`);
      }

      let completed = 0;
      elements["progress-label"].textContent = "Uploading image data…";
      const blobs = await mapWithConcurrency(selected, 1, async entry => {
        const content = await fileToBase64(entry.file);
        const blob = await createBlob(token, content);
        completed += 1;
        elements["progress-count"].textContent = `${completed} / ${selected.length}`;
        elements["upload-progress"].value = Math.round((completed / selected.length) * 88);
        return { ...entry, sha: blob.sha };
      });

      elements["progress-label"].textContent = "Creating one website update…";
      base = await currentBranch(token);
      const tree = await githubRequest(token, `/repos/${REPOSITORY}/git/trees`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          base_tree: base.treeSha,
          tree: blobs.flatMap(entry => deploymentPaths(entry.targetPath).map(path => ({
            path,
            mode: "100644",
            type: "blob",
            sha: entry.sha
          })))
        })
      });
      const message = elements["commit-message"].value.trim() || `media: add ${selected.length} Instagram images`;
      const commit = await githubRequest(token, `/repos/${REPOSITORY}/git/commits`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message, tree: tree.sha, parents: [base.commitSha] })
      });
      await githubRequest(token, `/repos/${REPOSITORY}/git/refs/heads/${BRANCH}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sha: commit.sha, force: false })
      });
      elements["upload-progress"].value = 100;
      elements["progress-label"].textContent = "Upload complete";
      setResult(`<strong>${selected.length.toLocaleString("en-GB")} images uploaded in one commit.</strong> Cloudflare will publish them automatically. <a href="https://github.com/${REPOSITORY}/commit/${commit.sha}" target="_blank" rel="noopener">View the commit</a>.`);
      queue.clear();
      renderQueue();
      setStep(3);
    } catch (error) {
      if (error.status === 401) {
        token = "";
        sessionStorage.removeItem("la_media_github_token");
        elements["auth-state"].textContent = "Session expired";
        elements["auth-state"].classList.remove("is-connected");
      }
      setResult(`<strong>Nothing was published.</strong> ${escapeHtml(error.message)}${error.status === 422 ? " The site may have changed during the upload; reconnect and try the batch again." : ""}`, true);
      elements["progress-label"].textContent = "Upload stopped";
    } finally {
      busy = false;
      updateUploadButton();
    }
  }

  elements["folder-input"].addEventListener("change", event => {
    if (event.target.files?.length) addFiles(event.target.files);
    event.target.value = "";
  });
  elements["clear-selection"].addEventListener("click", () => {
    queue.clear();
    elements.rejections.hidden = true;
    elements["selection-warning"].hidden = true;
    elements.result.hidden = true;
    setStep(1);
    renderQueue();
  });
  elements["connect-github"].addEventListener("click", connect);
  elements["start-upload"].addEventListener("click", upload);
  window.addEventListener("message", event => {
    if (event.origin !== window.location.origin || typeof event.data !== "string") return;
    if (event.data === "authorizing:github") {
      event.source?.postMessage("authorizing:github", event.origin);
      return;
    }
    const prefix = "authorization:github:success:";
    const errorPrefix = "authorization:github:error:";
    if (event.data.startsWith(errorPrefix)) {
      setResult("GitHub sign-in was not completed. Please try again.", true);
      return;
    }
    if (!event.data.startsWith(prefix)) return;
    try {
      const payload = JSON.parse(event.data.slice(prefix.length));
      if (payload.token) acceptToken(payload.token);
    } catch {
      setResult("GitHub sign-in returned an unreadable response. Please try again.", true);
    }
  });

  renderQueue();
  if (token) acceptToken(token);
}

if (typeof document !== "undefined") initialise();
