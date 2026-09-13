# London Advanced digest — scheduled-run instruction

Use this instruction only after the homepage component has been deployed and tested.
It is designed for the existing Sunday and Thursday 11:00 Europe/London automation.

## Run instruction

Read Gmail messages carrying the label `LA-Events` that have arrived since the previous
successful digest run. Include the four approved newsletter families: Londonist, The
Times, Londonfy and London x London.

Extract London events that are still bookable or realistically attendable after this
run. Deduplicate the same event across newsletters and recurring mentions. Verify every
candidate against the organiser or venue's official HTTPS page. Reject a candidate if
its date, time, venue, price or booking status cannot be verified with high confidence.

Score each candidate out of 10 using this fixed breakdown:

- non-obvious: 0–3
- London place/story value: 0–2
- unusual access or format: 0–2
- local character: 0–1
- value for money: 0–2

Keep only scores of 7 or more. Prefer free events. Ordinarily accept paid events only up
to £10. An event from £10.01 to £15 may be accepted only as an exceptional-value case
and must use the `exceptional` classification. Select at most three events, balancing
dates, boroughs and categories when quality is comparable.

Create the complete JSON document required by `schema/events.schema.json`. Use
`Europe/London` for the feed timezone and include explicit UTC offsets in every event
date-time. Set the feed validity window to the period this edit should remain current.
Set `publish_at` to this scheduled run and `expire_at` to 15 minutes after the event end.
Set every publication status to `approved` only after verification.

Before changing GitHub, validate the candidate with the same requirements enforced by
`scripts/validate-events.mjs`. If there are no valid events, if validation fails, or if
the official pages cannot be checked, do not change the repository. Report the reason
in the run result instead.

When the candidate is valid, update exactly one file in GitHub:

- repository: `ppastorin/London-advanced-site`
- branch: `main`
- file: `dist/data/events.json`

Use the commit message `content(events): refresh YYYY-MM-DD HH:mm Europe/London`, with
the actual London run date and time. Do not change application code, workflow files,
configuration or any other repository path. After the write, confirm that the GitHub
commit succeeded and report the number of published events and their titles.

Also produce an Italian Facebook-ready digest headed `THIS WEEK, BEYOND THE OBVIOUS`,
with one compact paragraph per event, the date/time, venue, price, booking status and
official link. Return it in the scheduled-run result for manual copying; do not publish
to Facebook.

