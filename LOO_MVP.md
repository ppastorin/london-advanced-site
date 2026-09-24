# Loo Finder MVP — dev preview

Branch-only MVP. It intentionally does not add the tool to production navigation.

- 65 curated entries
- “A loo nearby” browser geolocation
- “A loo near xyz” geocoding
- mobile-first nearest-results list plus optional map
- no community UI
- D1-ready schema for future reviews/submissions

GET /api/loos uses D1 when a LOO_DB binding exists; until then it returns the curated dist/data/loos.json seed. The schema is in db/loo-schema.sql.