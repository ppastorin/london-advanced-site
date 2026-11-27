---
name: la-events-digest
description: Prepare and publish the London Advanced weekend events digest from Gmail messages labelled LA-Events. Use for scheduled or manual digest runs, event-feed refreshes, weekend selections, homepage event highlights, source-coverage reviews, or Italian Facebook copy derived from the approved events.
---

# Events digest

Prepare one verified Friday-to-Sunday digest and publish only through the protected
repository path.

## Establish the run window

1. Use `Europe/London` for every calendar decision and timestamp.
2. Read every Gmail message with label `LA-Events` received in the rolling last five
   days. Include Londonist, The Times, ianVisits, Londonfy, London x London and every
   other sender carrying the label.
3. Consider events occurring from the coming Friday through the following Sunday,
   inclusive. Deduplicate repeat newsletter mentions and recurring listings.

## Preserve the source model

- Record discovery newsletters in `newsletter_sources` under their actual, trimmed
  publication names. Do not map an additional sender onto a named publication.
- Treat `newsletter_sources` as discovery provenance, not verification. Use the current
  official organiser, venue, council, museum, festival or ticketing page for
  `official_url` and `verification.source_url`.
- Report whether a recent labelled message was found from each of Londonist, The Times,
  ianVisits, Londonfy and London x London, and list additional labelled senders reviewed.

## Select candidates

Apply the price gate before scoring:

- free qualifies;
- £0.01 to £10 qualifies as cheap;
- £10.01 to £15 qualifies only when exceptionally distinctive;
- above £15 does not qualify;
- unclear, `from`, unconfirmed or donation-only pricing without a minimum does not
  qualify.

Score candidates from 0 to 10 using exactly:

- non-obviousness: 0 to 3;
- London place, history, architecture or cultural story: 0 to 2;
- temporary access, unusual opening or one-off format: 0 to 2;
- independent, local or neighbourhood character: 0 to 1;
- exceptional value: 0 to 2.

Keep only scores of 7 or more. Exclude generic mass-market listings, routine promotions,
weak product launches, expired or sold-out events, and sponsored items that do not pass
independent verification.

## Verify and write

1. Confirm date, time, venue, address, postcode, borough, exact price, booking status and
   availability against a first-party HTTPS page. Resolve conflicts in favour of the
   official source. Publish only at high confidence.
2. Paraphrase newsletter copy and do not reuse newsletter images.
3. Read the current `schema/events.schema.json`, `scripts/validate-events.mjs` and
   `dist/data/events.json` from `main`. Treat them as canonical instead of reproducing
   their field rules.
4. Produce a complete schema-version `1.1` replacement with:
   - the run time in `generated_at` and event `publish_at`;
   - the London run date in `valid_from` and the target Sunday in `valid_until`;
   - explicit UTC offsets and timezone `Europe/London`;
   - editorial title `THIS WEEK, BEYOND THE OBVIOUS`;
   - one to eight chronologically ordered approved events;
   - one to three matching IDs in `homepage_event_ids`;
   - event `expire_at` set 15 minutes after its end.
5. For an eligible Ticketmaster UK booking URL, preserve the direct URL and use only the
   affiliate wrapper enforced by the validator. Do not affiliate official or verification
   URLs, non-UK Ticketmaster pages or other providers.

## Validate and publish

1. Save the candidate document outside `dist/` and run
   `node scripts/validate-events.mjs <candidate.json>`. Do not write to GitHub unless it
   passes without errors.
2. Follow `la-safe-deployment` with this deliberately narrow manifest:
   `dist/data/events.json` only. Use branch `automation/events-YYYY-MM-DD-HHMM` and commit
   message `content(events): refresh YYYY-MM-DD HH:mm Europe/London`.
3. After the exact-head checks, merge and Cloudflare build succeed, fetch the live
   `/data/events.json`. Confirm its `generated_at` and event IDs match the merged file.
4. Stop without changing production if no event qualifies, any fact remains uncertain,
   validation fails, the manifest contains another file, or a deployment gate fails.

## Report

Return the published titles and homepage selections, a concise approved/held/rejected
review table, source coverage, repository and deployment evidence, and a polished Italian
Facebook post covering the approved events. Do not publish the Facebook post.
