import { spawnSync } from "node:child_process";

const files = process.argv.slice(2);
if (files.length === 0) {
  console.error("No test files were supplied.");
  process.exit(2);
}

const compact = spawnSync(process.execPath, ["--test", "--test-reporter=dot", ...files], {
  cwd: process.cwd(),
  encoding: "utf8"
});

if (compact.status === 0) {
  const passed = (compact.stdout.match(/\./g) || []).length;
  console.log(`${passed} tests passed across ${files.length} files.`);
  process.exit(0);
}

console.error("Node tests failed. Re-running with diagnostic output:");
const diagnostic = spawnSync(process.execPath, ["--test", "--test-reporter=spec", ...files], {
  cwd: process.cwd(),
  stdio: "inherit"
});
process.exit(diagnostic.status ?? 1);
