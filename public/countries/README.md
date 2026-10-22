# Country boundaries

Source: Natural Earth, Admin 0 countries, 1:50m, repository release **v5.1.2**.

- [Original GeoJSON](https://raw.githubusercontent.com/nvkelso/natural-earth-vector/v5.1.2/geojson/ne_50m_admin_0_countries.geojson)
- [Dataset documentation](https://www.naturalearthdata.com/downloads/50m-cultural-vectors/50m-admin-0-countries-2/)
- [Public-domain terms](https://www.naturalearthdata.com/about/terms-of-use/)
- Retrieved: 2026-10-22.
- Source SHA-256: `3e458fc036ad0a66411f2c1e6cac49c5d7bfb81cb1123bc513b22511a2b7fdeb`.

Regenerate with `node scripts/import-country-boundaries.mjs` from the repository
root. The importer verifies the source checksum before writing assets.

Geometry is retained from the source. Features are split into individual files;
properties are reduced to `ADM0_A3` (stored as `id`) and `NAME_EN` (`name`).
`app/data/countries.json` contains the matching alphabetized selection list.
Identifiers are Natural Earth's administrative codes, not necessarily ISO codes.

This is a versioned geographic snapshot, not a current geopolitical feed.
Natural Earth uses de facto boundaries and includes dependent territories.
The generalized coastlines may differ from the more detailed OpenStreetMap basemap.
