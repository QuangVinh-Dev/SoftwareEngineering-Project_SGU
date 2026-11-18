# POI → GPS → audio audit

Date: 2026-10-13

## Scope and flow found

- Admin POI management (`HA_ADMIN/src/pages/POIManagement.tsx`, `HA_ADMIN/src/services/adminContentApi.ts`) calls `POST/GET/PUT /api/admin/pois`.
- `AdminPoiController` validates coordinates and an integer activation radius; `AdminPoiService` maps the request into the existing `poi` entity/table. `latitude` and `longitude` are decimal degrees and `radius` is meters (`HA_App/version_1.0.sql`, `poi.radius`). No schema change was needed.
- User geofence fetches `GET /api/poi/locations`. `PoiService` returns ACTIVE rows as `{id,name,latitude,longitude,radius}`. This is the same database identity and coordinate/radius source as Admin.
- On activation, User calls `GET /api/poi/{poiId}/audio?languageCode={lowercase code}`. The query returns only approved translations whose language and voice are active. Audio rows expose `filePath`; `/uploads/audio/**` is public and served from the configured audio storage directory. The SQL-backed audio API returns JSON metadata; the browser player then requests that file URL and reports playback/load errors separately.

## Changes made

- `HA.USER/hoi-an-app/src/utils/geo.js`: validates coordinates and POI radii, retains Haversine degree-to-radian conversion and meter output, clamps floating point error, and adds nearest eligible POI selection. POIs are filtered by their own `distance <= radius` before choosing the smallest distance.
- `HA.USER/hoi-an-app/src/hooks/useGeofence.js`: validates API POI coordinates, rejects malformed GPS fixes, requests high accuracy with a shorter cached-fix age, skips fixes whose accuracy exceeds 100 meters, recomputes selection on each GPS update, and de-duplicates audio requests by POI/language for the page session. GPS denial/unavailable/timeout remain surfaced to the app.
- `HA.USER/hoi-an-app/src/services/audioService.js`: selects only a returned audio record whose language code exactly matches the requested language and whose file path is non-empty.
- `HA.USER/hoi-an-app/src/utils/__tests__/geo.test.js` and the User package test script: added native Node regression tests without dependencies.
- `HA.USER/hoi-an-app/src/components/Player.jsx`: removed pre-existing unresolved Git conflict markers that stopped the User production build; retained loading-state display used by the audio player.

Initial audit observation that browse/map/detail used the static catalogue was resolved in the audit update below. Admin POI data has no category, hours, price, image, or route metadata; the updated UI does not fabricate these fields.

## Verification results

- **PASS** — `cd HA.USER/hoi-an-app && npm test`: 5 assertions covered zero distance, inclusive radius boundary, nearest eligible POI with a closer out-of-range POI, no eligible POI, malformed coordinates, and poor GPS accuracy.
- **PASS** — `cd HA.USER/hoi-an-app && npm run build`: production build succeeded after conflict-marker repair. Vite reported existing unresolved `/images/hero-fallback.jpg` and `/images/hero.jpg` references; they remain runtime paths.
- **Historical initial run, superseded by final rerun below** — the first `./mvnw test` attempt had Mockito/PostgreSQL environment errors. The final rerun completed all 21 tests successfully.
- Runtime verification was later completed on the modified source at port 9998; see Runtime verification correction below. Admin create/read round-trip, deployed CORS from the deployed User origin and actual browser playback remain NOT VERIFIED.
- **PASS by code inspection; live behavior NOT VERIFIED** — GET POI/audio APIs are public in `SecurityConfig`, `/uploads/audio/**` is public, and configured CORS allows the two local Vite origins (`5173`, `5174`). The audio resource handler serves files from the same `AUDIO_STORAGE_PATH` used by upload storage; verify deployed volume/path parity before relying on uploaded files.

## Manual verification

1. Start the existing PostgreSQL/Redis/services and backend with the repository's documented Docker Compose setup. Preserve existing volumes/data.
2. Start Admin and create an ACTIVE POI with known latitude, longitude, and radius. Confirm it appears from both `GET /api/admin/pois` and `GET /api/poi/locations` with the same ID and values.
3. Upload/approve audio for a supported language. Confirm `GET /api/poi/{id}/audio?languageCode=vi` returns that exact POI/language record and its `filePath` returns HTTP 200 with MP3 content type and playable bytes.
4. Serve User over HTTPS or localhost, grant location permission, select that language, and test inside/outside the saved radius. Confirm no request repeats for each GPS fix, switching language requests that language once, and browser playback succeeds. Use browser Network/Media panels to distinguish metadata JSON success from a successfully loaded and played MP3.
5. Backend test suite passed locally (21/21). For full Admin create/update verification, use a disposable database or a controlled cleanup plan because no POI delete API exists.


## Audit update — 2026-10-13

HA.USER now obtains its single POI collection from GET /api/poi/locations. The same numeric ID and response objects feed the guest list, map markers and popup/detail, and GPS geofence. No POI screen reads src/data/pois.js as its POI source. The static route itinerary only references IDs that exist in the backend response.

Code inspection confirmed Admin uses POST/GET/PUT /api/admin/pois, with POI_ADMIN authorization. AdminPoiService persists to the existing poi table through PoiRepository; DELETE POI is not implemented. The guest endpoint selects only ACTIVE rows and was already public under SecurityConfig. Its response preserves id, name, latitude, longitude and radius, and now adds status, originalDescription and directionLink for guest details. Coordinates remain backend decimal degrees; frontend markers pass [longitude, latitude]. The database has no category, images, opening hours or price fields, so those are not fabricated.

Audio uses GET /api/poi/{id}/audio?languageCode={lowercase-code}; returned filePath values resolve against the configured API base URL. Audio requests are checked against both poiId and requested language. Missing language/audio (404 or no matching audio record) opens the existing empty-player state; stale responses are discarded. Security permits guest GET and /uploads/audio/**. AudioResourceConfig serves files from configured audio.storage-path. The source-built runtime returned a real Japanese MP3 with HTTP 200/audio-mpeg; browser playback itself remains NOT VERIFIED.

Changed HA.USER files: App.jsx (shared load and props), services/poiService.js (API fetch, envelope handling and DTO normalization), hooks/useGeofence.js (shared API collection), components/Categories.jsx, AllPoisPage.jsx, Routes.jsx and MapPage.jsx (backend-driven browse/map/detail and invalid-coordinate skipping), PoiModal.jsx (backend coordinates and language UI), PoiCard.jsx (removed fixed language-count claim), config/api.js (development and same-origin production URL selection), hooks/useTranslation.js (null-safe backend fields), services/audioService.js (response handling and matching), and the pre-existing Player.jsx conflict-marker repair. Existing work in geo.js and its tests was retained.

Backend files changed: PoiLocationResponse.java and PoiService.java, to expose Admin-stored description/status/direction link through the already-public ACTIVE locations endpoint. HA_App/docs/POI_GPS_AUDIO_AUDIT_REPORT.md records this audit. No schema, migration, security rule, or Admin mutation endpoint was changed.

Verification: HA.USER npm test passed (1 Node test file; 1 reported test, 0 failed); npm run build passed. Vite retains pre-existing unresolved /images/hero-fallback.jpg and /images/hero.jpg runtime references. Backend ./mvnw test passed: 21 tests, 0 failures/errors/skips (PostgreSQL test context connected successfully). CRLF-aware git diff whitespace check passed. Live GET /api/poi/locations was attempted with curl but localhost:9999 refused connection. Admin round-trip, deployed CORS, audio file HTTP status/MIME and real browser playback remain NOT VERIFIED. Do not report end-to-end PASS without those runtime checks.

Manual confirmation: create an ACTIVE POI in Admin with a known coordinate/radius and description; confirm POST succeeds and refresh GET /api/admin/pois; confirm GET /api/poi/locations returns that same ID/coordinate/radius/description; reload HA.USER and verify list, marker location and detail match; edit coordinate/status and reload (INACTIVE should disappear); grant GPS and enter/leave its radius; request audio for a language with an approved translation and verify the returned filePath is HTTP 200 audio/mpeg and plays; repeat with a language without audio and confirm the player shows its empty state.


## Runtime verification correction — 2026-10-13

A backend process built from the modified source was started temporarily on localhost:9998 and stopped after read-only checks. GET /api/poi/locations returned HTTP 200 with ACTIVE POIs and all eight expected fields, including the newly exposed description/status/direction link. GET /api/poi/1/audio?languageCode=vi returned HTTP 200 with an empty array, which is the expected no-audio UI case. The Japanese query returned the POI-specific filePath; GET of that exact path returned HTTP 200, Content-Type audio/mpeg, 46,412 bytes. The frontend empty-audio and file-error UI paths are verified by code; actual browser playback remains NOT VERIFIED.

The already-running service at localhost:9999 returned HTTP 200 but still exposes the previous five-field DTO. It is an older runtime and must be redeployed/restarted from the changed source before HA.USER can receive description/status/directionLink there. A startup attempt on port 9999 could not bind because that port was already occupied. No Admin create/update was performed: the API has no POI delete operation, so a test record could not be safely cleaned up. Consequently Admin-to-DB write round-trip and deployed FE-to-BE end-to-end behavior remain NOT VERIFIED.
