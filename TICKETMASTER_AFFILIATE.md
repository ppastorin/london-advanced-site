# Ticketmaster UK affiliate integration

London Advanced uses explicit Ticketmaster UK deep links. It does not load a third-party
link-rewriting script.

## Approved tracking identifiers

- Publisher: `7729619`
- Campaign: `1965662`
- Creative/link: `24023`
- Wrapper: `https://ticketmaster.evyy.net/c/7729619/1965662/24023?u=`

These identifiers are not secrets. No Cloudflare environment variable or npm package is
required.

## Event data

Keep the clean Ticketmaster UK destination in `booking.url`. Put the corresponding
tracking URL in the optional `booking.affiliate_url` field:

```json
"booking": {
  "required": true,
  "status": "required",
  "url": "https://www.ticketmaster.co.uk/fontaines-dc-tickets/artist/5281142",
  "affiliate_url": "https://ticketmaster.evyy.net/c/7729619/1965662/24023?u=https%3A%2F%2Fwww.ticketmaster.co.uk%2Ffontaines-dc-tickets%2Fartist%2F5281142"
}
```

Generate the value with:

```js
const wrapper = "https://ticketmaster.evyy.net/c/7729619/1965662/24023";
const affiliateUrl = `${wrapper}?u=${encodeURIComponent(bookingUrl)}`;
```

Use the most specific event/performance page available, not an artist page, when the
specific page is known.

## Rendering and disclosure

The homepage and `/events/` render `booking.affiliate_url` ahead of the direct booking
URL. Affiliate buttons are visibly labelled `Ad · Book on Ticketmaster`, include
`rel="sponsored noopener noreferrer"`, and show a commission disclosure next to the
link. If the affiliate URL is missing or invalid, the site falls back to the clean
booking or official URL.

## Validation

Run:

```bash
npm test
```

Validation rejects affiliate links that do not use the approved account, do not lead to
Ticketmaster UK, contain unexpected parameters, or do not exactly match `booking.url`.

The scheduled events instruction automatically creates the affiliate URL only when the
verified booking destination is Ticketmaster UK.
