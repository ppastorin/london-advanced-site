# London Advanced menu fix v1.4

Replace only these files in the repository's `dist` directory:

- `dist/app.js`
- `dist/content.js`
- `dist/styles.css`

Do not replace `wrangler.jsonc` or `dist/_headers`.

Changes:

- Replaces the LA/red-dot mark with a compass symbol and London Advanced name.
- Removes the duplicate Get the guide header link.
- Keeps one Guide link in the main menu.
- Makes Tools a dropdown containing all five public Google Sites tool pages.
- Makes Community a dropdown containing Facebook and Instagram.
- Uses button-driven section scrolling for Journal and Explore the tools, avoiding Worker hash URLs.
