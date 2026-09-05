# London Advanced — Usability and Visual Refresh v1.6

This release keeps the Google Sites-compatible navigation from v1.5 and redesigns the page for faster scanning, shorter scrolling, and stronger visual hierarchy.

## What changed

- Tool cards now use five distinct graphical panels, larger icons, stronger colour coding, and an explicit Open tool action.
- Desktop cards are substantially shorter and contain less dead space.
- Mobile cards become compact horizontal rows; the secondary description is hidden while the tool name and purpose remain visible.
- The navigation is sticky inside the embedded page, making the mobile menu easier to reach after scrolling.
- The mobile menu is denser and keeps all five tools, Guide, Journal, Facebook, and Instagram.
- Hero, Tools, Guide, Journal, Community, and footer spacing has been reduced.
- All v1.5 navigation protections remain: external destinations open automatically in a new tab, while Journal and Explore the tools scroll within the current view.
- Cloudflare deploys only `dist/`.

## Important platform limitation

Google Sites places custom HTML embeds in a sandbox that allows pop-ups but does not allow top-level navigation. Consequently, an embedded link cannot replace the complete Google Sites browser tab. `target="_top"` and equivalent JavaScript are blocked by the browser.

Version 1.6 continues using the reliable behavior permitted by Google Sites: external destinations open automatically in a new tab after a normal click or tap. True same-tab navigation requires either native links placed directly in Google Sites or making the Cloudflare site the top-level website.

Follow `INSTALL_AND_TEST.md` in order.
