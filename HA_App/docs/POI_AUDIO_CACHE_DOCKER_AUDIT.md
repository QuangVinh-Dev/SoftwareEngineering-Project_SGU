# POI audio, frontend cache, and Docker audit

Audit date: 2026-10-13

## 1. Audio root cause and code changes

The source-path root cause is in the frontend state flow. Changing the header language updated `currentLang`, but a manually opened player was not associated with its selected POI or language. The audio URL already assigned to the player therefore remained the old language. GPS playback was a separate path and could use the last geofenced POI instead of the POI currently selected in the modal. This path-level failure was traced from the language state and player code; it was not exercised in a real browser in this environment.

The current API contract is `GET /api/poi/{poiId}/audio?languageCode={code}`. The controller returns a JSON list of `PoiAudioResponse` records (`id`, `languageCode`, `languageName`, `filePath`, `durationSeconds`, `voiceName`); it does not stream audio from that endpoint. The actual MP3 is served separately from `/uploads/audio/**` by Spring's static resource handler. The existing API base URL configuration resolves to `http://localhost:9999` in Vite development and to same-origin URLs in a production build unless `VITE_API_BASE_URL` is supplied.

`App.jsx` now keeps the selected player POI and language. A language change requests a new audio record for that same POI, while switching POI or language aborts the obsolete fetch and invalidates its response token. The player displays a loading state during the API request. `useGeofence.js` no longer lets its GPS audio effect replace a manually selected player while the GPS watcher is disabled. `audioService.js` passes request cancellation through to `fetch`. Exact language matching remains enforced; there is no Vietnamese fallback. The existing player's `NotAllowedError` path leaves Play available and reports that a user gesture is needed.

Files changed for this task: `HA.USER/hoi-an-app/src/App.jsx`, `HA.USER/hoi-an-app/src/hooks/useGeofence.js`, `HA.USER/hoi-an-app/src/hooks/usePlayer.js`, and `HA.USER/hoi-an-app/src/services/audioService.js`. These files already had unrelated uncommitted changes when the audit began; those changes were preserved.

## 2. Live multilingual data and endpoint check

POI 4, “Banh Mi Phuong,” was used because it has approved translations/audio for four requested languages. API requests were made against the running backend at `http://localhost:9999`; files were then requested directly through the backend. The API returns `application/json`; audio files return `audio/mpeg`.

| Language | Request | API | Translation | Audio record/file | File request | Playback |
|---|---|---:|---|---|---:|---|
| VI (`vi`) | POI 4, `languageCode=vi` | 200 | APPROVED | Present; `/uploads/audio/vi-2880e345-17d8-4e52-905c-eb2e648e92f6.mp3` | 200 `audio/mpeg` | Browser playback not exercised |
| EN (`en`) | POI 4, `languageCode=en` | 200 | APPROVED | Present; `/uploads/audio/en-9420c87d-44c7-4b1a-ba65-d58ec462795f.mp3` | 200 `audio/mpeg` | Browser playback not exercised |
| JA (`ja`) | POI 4, `languageCode=ja` | 200 | APPROVED | Present; `/uploads/audio/ja-010bc4c5-726a-428a-9c68-00d78c6c8f2a.mp3` | 200 `audio/mpeg` | Browser playback not exercised |
| KO (`ko`) | POI 4, `languageCode=ko` | 200 | APPROVED | Present; `/uploads/audio/ko-8317ea86-a7ee-4d32-b887-c4a0933f7bfe.mp3` | 200 `audio/mpeg` | Browser playback not exercised |
| ZH (`zh`) | POI 4, `languageCode=zh` | 200 | No translation row | No audio record/file; API body `[]` | Not applicable | Correctly expected to show no audio; browser UI not exercised |

The database records for the four files are joined to APPROVED translations, and each file was reachable from the backend container's mounted storage via HTTP. This rules out missing files, wrong API port, and an incorrect JSON field name for this tested POI. Other POIs have incomplete or pending records: for example POI 1 has VI and EN translations marked PENDING, which the approved-audio query intentionally excludes. Do not treat its seeded file rows as playable without approval.

## 3. Frontend cache and deployment

- Found and removed `HA.USER/hoi-an-app/node_modules/.vite/`; removed the old `dist/` before building.
- Rebuilt production output. `dist/index.html` references hashed assets, including `index-BeLlaulD.js` and `index-ByPLwUxb.css`.
- No Service Worker, Workbox, Cache Storage registration, or PWA plugin/configuration was found in this frontend.
- Backend JSON responses observed in the live API include `Cache-Control: no-cache, no-store, max-age=0, must-revalidate`.
- Compose defines the API/backend and its dependencies, not a frontend server. No Vite frontend process was running during the audit. The frontend's deployment server/CDN and its index/document cache headers could not be inspected here.
- The production API base defaults to same-origin (`VITE_API_BASE_URL` empty when not set). If the built frontend is hosted on a different origin from the API, set `VITE_API_BASE_URL` at build time and rebuild; Vite embeds it in the bundle.
- Browser confirmation still required: open DevTools, enable Network → Disable cache, hard reload, and inspect the audio API request for the selected POI and language. Check Application → Service Workers/Cache Storage if the deployed host adds a worker, then verify the MP3 request returns 200 and `audio/mpeg`. Browser playback and quick language/POI race scenarios were not run in this environment.

## 4. Docker measurements and findings

The following are two point-in-time `docker stats --no-stream` readings. No Docker resource setting/service was changed between them, and workload was not controlled; the second snapshot is **not** evidence of an optimization.

| Container | CPU before → after | RAM before → after | Net I/O before → after | Block I/O before → after |
|---|---:|---:|---:|---:|
| `hoian-app` | 0.28% → 0.28% | 515.5 → 529.4 MiB | 83.7 kB/44 kB → 121 kB/373 kB | 113 MB/188 kB → 122 MB/385 kB |
| `hoian-piper-tts` | 0.11% → 0.12% | 107.4 → 107.4 MiB | 33 kB/3.42 kB → 42.3 kB/3.42 kB | 67.3 MB/36.9 kB → 67.3 MB/36.9 kB |
| `hoian-libretranslate` | 0.01% → 0.01% | 301.5 → 301.4 MiB | 86.6 kB/19.9 kB → 95.9 kB/19.9 kB | 104 MB/221 kB → 104 MB/221 kB |
| `hoian-postgres` | 3.34% → 0.00% | 66.85 → 68.55 MiB | 63.3 kB/54 kB → 103 kB/74.7 kB | 35.7 MB/369 kB → 37 MB/369 kB |
| `hoian-redis` | 0.41% → 1.67% | 12.96 → 14.38 MiB | 24.8 kB/126 B → 34.1 kB/126 B | 9.84 MB/0 B → 9.84 MB/0 B |
| `postgres_container_unimate` (not in Hội An Compose) | 0.00% → 0.01% | 41.35 → 41.35 MiB | 24.7 kB/126 B → 34 kB/126 B | 24.9 MB/111 kB → 24.9 MB/111 kB |

Docker reports network and block I/O as read/write pairs; units in the table follow the reported values. All containers saw a 15.31 GiB host limit and had no per-container memory limit (`HostConfig.Memory=0`). Restart counts were zero. `hoian-app` was the largest memory user at both samples; PostgreSQL briefly had the highest CPU sample (3.34%). This is low observed utilization, not proof of sustained cost or a leak. The app has 54 processes; Piper has 40. PostgreSQL showed 10 idle JDBC connections at the query sample. Redis reported about 988 KiB used memory and zero keys.

`docker system df` reported 82 images / 18.25 GB, 11 containers (6 active), and 5 volumes / 1.321 GB; all five volumes were active, so none was eligible for safe volume cleanup. A second PostgreSQL container, `postgres_container_unimate`, is running outside `HA_App/docker-compose.yml`; it was left untouched. The checked Compose services have no memory limits. Container JSON log paths were identified, but host file sizes were inaccessible due Docker log-file permissions; recent app logs showed verbose Hibernate SQL (`spring.jpa.show-sql=true`). No repeated GPS/API request storm was established from the limited runtime sample. No code/resource optimization or cleanup of images, containers, or volumes was applied because the snapshots do not justify safely removing a dependency or choosing a memory cap. A controlled loaded comparison remains outstanding.

## 5. Tests/build results

| Command | Result |
|---|---|
| `npm test` in `HA.USER/hoi-an-app/` | PASS, 1 test file / 1 test |
| `npm run build` in `HA.USER/hoi-an-app/` | PASS; Vite emitted hashed assets. Existing unresolved-at-build-time references to `/images/hero-fallback.jpg` and `/images/hero.jpg` remain runtime paths. |
| `./mvnw test` in `HA_App/` | PASS on retry with host permissions, 21 tests / 0 failures / 0 errors. Initial sandbox run could not attach Mockito's agent or connect to PostgreSQL; it was an environment restriction. |

## 6. Remaining verification

The code and API paths were checked, but no real browser session was available to validate audio decoding, autoplay policy, button behavior, rapid EN→JA switching, POI changes during an in-flight request, reload behavior, or the visible no-audio message. Verify those scenarios in the deployed browser using the Network panel steps above. Also confirm the production host's frontend origin and `VITE_API_BASE_URL`, and take Docker statistics again under a representative, repeatable workload before setting resource limits or removing anything.
