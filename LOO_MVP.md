# Loo Finder

- 165 curated entries
- 42 verified public-park facilities
- “A loo nearby” browser geolocation
- “A loo near xyz” geocoding
- mobile-first nearest-results list plus optional map
- no community UI
- D1-ready schema for future reviews/submissions

GET /api/loos uses D1 when a LOO_DB binding exists; until then it returns the curated dist/data/loos.json seed. The schema is in db/loo-schema.sql.
