# London Advanced digest — full-list scheduled-run instruction

Use this instruction for the existing Sunday and Thursday 11:00 Europe/London task after
the full events page has been deployed and tested. Do not create a second task.

## Run instruction

Prepare and publish the London Advanced events digest.

Read Gmail messages carrying the label `LA-Events` received in the last 10 days. Parse
the newsletter content and consider Londonist, The Times, Londonfy and London x London.
Extract London events taking place from the coming Friday through the following Sunday,
inclusive. Deduplicate the same event across newsletters and recurring mentions.

Apply these price rules: free qualifies; £0.01–£10 qualifies as cheap; £10.01–£15
qualifies only when exceptionally distinctive; above £15 is rejected. Hold or reject
unclear prices, `from` prices, unconfirmed prices and donation-only listings without a
clear minimum.

Score each candidate from 0–10 using exactly:

- non-obviousness: 0–3
- London place, history, architecture or cultural story: 0–2
- temporary access, unusual opening or one-off format: 0–2
- independent, local or neighbourhood character: 0–1
- exceptional value: 0–2

Keep only candidates scoring at least 7. Exclude generic mass-market listings, routine
promotions, weak product launches, sold-out events, expired events and sponsored items
unless independently verified and genuinely eligible.

Verify every publishable candidate against a current official organiser, venue, council,
museum, festival or ticketing page. Prefer first-party HTTPS links. Confirm the date,
start and end time, venue, address, postcode, borough, exact price, booking requirement
and availability. Use the official source when newsletters conflict. Do not publish any
candidate unless confidence is high. Paraphrase newsletter wording and do not reuse
newsletter images.

Keep between one and eight strongest verified events for the complete `/events/` page.
When more than eight pass, prioritise quality first and balance dates, boroughs and
categories when quality is comparable. From that same approved set, select between one
and three strongest events for the homepage.

Before writing, fetch these files from GitHub repository
`ppastorin/London-advanced-site` on branch `main`:

- `schema/events.schema.json`
- `dist/data/events.json`

Create a complete replacement document conforming to schema version `1.1`. Use timezone
`Europe/London` and editorial title `THIS WEEK, BEYOND THE OBVIOUS`. Use the run's London
calendar date as `valid_from` and the following Sunday as `valid_until`. Use explicit UTC
offsets in all event date-times. Set `publish_at` to this run time and `expire_at` to 15
minutes after the event end. Set `publication_status` to `approved` only after full
verification.

Put every approved event in the `events` array, ordered chronologically. Put the IDs of
the one to three homepage selections in `homepage_event_ids`, in their intended homepage
display order. Every homepage ID must match exactly one event in `events`. Ensure every
advanced breakdown totals its score, every URL is HTTPS, every ID is a lowercase slug,
and IDs and `duplicate_key` values are unique.

Validate the complete document against all schema and semantic rules before any
repository write. If there are no valid events, validation fails, official verification
is unavailable, or GitHub cannot be read safely, do not change GitHub. Report the reason.

When the document is valid, update exactly this one GitHub file on branch `main`:

`dist/data/events.json`

Do not create, edit or delete any other repository file. Use commit message
`content(events): refresh YYYY-MM-DD HH:mm Europe/London` with the actual run date and
time. After updating, fetch the committed file again and confirm it matches the validated
document. Report the commit result, all titles published and the homepage selections.

Also return:

1. An editorial review table showing approved candidates and held or rejected candidates
   with concise reasons.
2. A polished Italian Facebook post titled `THIS WEEK, BEYOND THE OBVIOUS`, covering the
   same approved events in the `events` array, up to eight, with date, price, booking note
   and official links. Do not publish it to Facebook.
3. Source coverage showing whether at least one recent tagged email was found from each of
   Londonist, The Times, Londonfy and London x London.
