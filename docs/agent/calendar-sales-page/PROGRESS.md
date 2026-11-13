# Calendar sales page

## Phase status

- Phase 1: complete

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
- The screenshots show Italian month and weekday labels and Italian public holidays. This is disclosed rather than hidden.
- Saal Digital handles the external order flow. No price is stated because none was supplied or reliably visible.

## Verification

- Initial dedicated check: 17 expected failures before generated page and assets existed.
- Final dedicated check: 0 failures.
- Full `npm test`: 157 passed, 0 failed.
- Desktop page and homepage promotion reviewed in the managed browser preview.
- Source and deployed image bytes match for all three screenshots.

## Files touched

- English calendar source page and styles.
- Three source screenshots and three deployed copies.
- English homepage application, generated page and styles.
- Italian homepage transform exclusion.
- Pre-render copy step, sitemap, validator, regression test and task check.

## Next step

- Open the pull request, wait for the exact head CI check, merge, then verify production.
