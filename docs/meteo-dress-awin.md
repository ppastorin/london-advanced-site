# Meteo Dress: Maxi Sport Awin feed

The browser requests `/api/meteo-dress-products`. The Cloudflare Worker downloads and normalizes the private gzip CSV, caches the JSON response for six hours, and never exposes the private feed URL.

## Preview setup

1. Open the Cloudflare Worker for this branch preview.
2. Add an encrypted secret named `AWIN_MAXISPORT_FEED_URL` to the **preview** environment.
3. Paste the complete private Awin download URL as its value.
4. Redeploy the branch preview, then open `/meteo-dress/`.
5. Submit the form and confirm four Maxi Sport cards appear.
6. Check `/api/meteo-dress-products`: it should return JSON with `source`, `snapshotUpdated`, and `products`.

Without the secret the endpoint intentionally returns HTTP 503 with `feed_not_configured`. Do not commit the URL, the downloaded archive, or a generated product catalogue.
