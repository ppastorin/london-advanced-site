# London Advanced release safeguards

## Binary assets

- Treat image and other binary updates as part of the same atomic release as the content or tests that reference them.
- When GitHub blobs are created through an API, upload large binaries in base64 chunks whose decoded chunk size is divisible by three, then concatenate the chunks before creating the blob.
- Verify every returned blob SHA against `git hash-object <local-file>` before building the tree.
- Build the complete tree and commit before creating the release branch or pull request.
- After opening a pull request, verify that its changed-file manifest contains every intended source and deployed asset before relying on CI.

## Publication

- Run `npm test` before opening a pull request.
- Do not merge until the latest `Site safety checks` run succeeds for the exact pull-request head SHA.
- Production is deployed only by Cloudflare Workers Builds after the merge to `main`; verify the live asset bytes and page after deployment.
