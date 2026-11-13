# Calendar sales page

## Phase status

- Phase 1: complete
- Phase 2: complete

## Phase 2 acceptance criteria

- Make the new UK wall and desk editions the primary purchase options.
- Keep both Italian editions available as clearly labelled secondary options.
- Remove the red order-information banner.
- State that the UK editions use English labels and bank holidays for England.
- Clarify that the supplied preview images show the Italian edition while the photography and layout are shared.
- Keep the page and homepage promotion in the English section only.
- Pass the full test suite and exact pull request CI check before merge.
- Verify all four purchase links and the updated page in production.

## Acceptance criteria

- Publish one indexable English page at `/calendars/` for the two 2027 calendars.
- Use the three supplied screenshots and link each product to the correct Saal Digital shop page.
- State clearly that delivery is limited to UK addresses and that the printed calendar grid is in Italian.
- Add a prominent homepage promotion above the tools section.
- Keep the promotion and sales page out of the Italian section.
- Pass the full test suite and the exact pull request CI check before merge.
- Verify the page, images and outbound links in production after Cloudflare deployment.

## Decisions and assumptions

- The first shop link is titled `London Advanced Calendar 2027` and is presented as the wall calendar.
- The second shop link is titled `Desk calendar square 2027` and is presented as the square desk calendar.
- The UK shop links are the primary calls to action; the original Italian editions remain clearly labelled secondary options.
- The screenshots show the shared photography and layout from the Italian editions. This is stated in the hero caption so the imagery is not misrepresented.
- Saal Digital handles the external order flow. No price is stated because none was supplied or reliably visible.

## Verification

- Initial dedicated check: 17 expected failures before generated page and assets existed.
- Final dedicated check: 0 failures.
- Full `npm test`: 157 passed, 0 failed.
- Desktop page and homepage promotion reviewed in the managed browser preview.
- Source and deployed image bytes match for all three screenshots.
- Phase 2 initial dedicated check: 7 expected failures.
- Phase 2 final dedicated check: 0 failures.
- Phase 2 full `npm test`: 157 passed, 0 failed.
- Phase 2 desktop page reviewed in the managed browser preview.

## Files touched

- English calendar source page and styles.
- Three source screenshots and three deployed copies.
- English homepage application, generated page and styles.
- Italian homepage transform exclusion.
- Pre-render copy step, sitemap, validator, regression test and task check.

## Next step

- Publish Phase 2 through the protected pull request workflow and verify production.
