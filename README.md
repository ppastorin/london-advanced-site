# London Advanced — Navigation Fix v1.5

This release fixes navigation when the Cloudflare page is embedded in Google Sites.

## What changed

- All five tool cards and both desktop/mobile tool menus use normal links that open automatically in a new tab.
- Guide, story, Facebook, and Instagram links use the same Google Sites-compatible behavior.
- The compass wordmark is no longer a dead link.
- Journal and Explore the tools remain same-view controls and scroll inside the embedded page.
- A complete mobile menu appears at 900 px and below.
- Cloudflare is explicitly configured to deploy only `dist/` instead of the repository root.

## Important platform limitation

Google Sites places custom HTML embeds in a sandbox that allows pop-ups but does not allow top-level navigation. Consequently, an embedded link cannot replace the complete Google Sites browser tab. `target="_top"` and equivalent JavaScript are blocked by the browser.

Version 1.5 uses the reliable behavior permitted by Google Sites: external destinations open automatically in a new tab after a normal click or tap. True same-tab navigation requires either native links placed directly in Google Sites or making the Cloudflare site the top-level website.

Follow `INSTALL_AND_TEST.md` in order.
