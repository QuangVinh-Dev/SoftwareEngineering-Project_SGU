# Local validation — configuration-only hostfix deployment branch

## Provenance and preservation

Base: origin/hostfix 00771658122f2e46b931ff1e4199b76a122f7fd3.
Pinned frontend source: origin/feature 42d982969a3a656131ebaf0864678f69042e6313.
The original checkout was on review/frontend-deploy-hostfix with six DU conflicts,
eight dirty/new frontend business files and stash backup. It was not switched, unstashed,
reset or cleaned. Work occurs in a separate worktree, /tmp/hoian-deploy-hostfix.
Original Data_Storage has 21 files, 2,023,503 bytes; hashes, uid/gid and modes were
snapshotted for final verification. It is not tracked/staged in this deployment branch.
Only deployment configuration, scripts and documentation are imported. Application source
used for builds is materialized under /tmp from Git objects, never staged or imported
from the dirty working tree. All .env files are excluded before materialization.

## Commands actually run

```text
python3 deploy/frontend/tests/run.py
python3 deploy/frontend/tests/verify_compose.py
```

run.py used a new project hoian-deploy-test-878bed7f08a2 and image tag
test-878bed7f08a2. Source/test state: /tmp/hoian-build-source-byuswd4t/test-state.json.
It ran docker compose config, build, up --wait, verify.py and audit.py.
No production/existing containers, networks or volumes were used for HTTP/load tests.
The later Compose regression renders the actual pinned backend file without interpolation
or an .env file; it does not start a backend or apply any overlay.

## Actual results

| Check | Result |
|---|---|
| User/admin/owner npm ci + Vite production build | PASS all three |
| Edge/fixture images | PASS |
| Compose render and isolation guard | PASS; no app service in test stack, no host ports/bind mounts/data volumes |
| Legitimate production overlays | PASS: Spring/backend image/build/command/ports/data volumes preserved |
| Wrong backend + test merge | Rejected by standalone file resolution; no mutation performed |
| CORS override render | PASS: exact three production Origins |
| Nginx syntax | PASS all three frontends and edge |
| Runtime user/read-only/health | PASS |
| Four Host header routes | PASS; API upstream identifies itself as isolated-api-fixture |
| SPA fallback, JS/CSS MIME/cache | PASS all three |
| Dotfiles/config/missing asset protections | PASS |
| All emitted runtime static files | PASS; user 4 image files, admin 0, owner 1 |
| Production API URL in bundle | PASS; no localhost:9999 |
| Frontend data-network exclusion | PASS; only project frontend network |
| Runtime/config/history known-secret check | PASS within scanner scope |
| Sanitized logs | PASS; query marker absent |
| 429 CORS and Retry-After | PASS allowed Origin; no ACAO for untrusted Origin |
| Preflight | PASS three allowed Origins 204 through fixture; untrusted Origin 403 |
| Ordinary bucket does not starve preflight | PASS |
| Independent finite polling bucket | PASS, eventual 429 under burst |
| Login/payment finite buckets | PASS against fixture; no credential/payment sent |

Ordinary bucket burst: 24 simultaneous requests => 6 HTTP 200, 18 HTTP 429.
IP A exhaustion does not block IP B; changing CF-Connecting-IP/XFF does not escape A's
bucket. An alternate API path is still limited. Health/static and IPN remain available.
One new ordinary request succeeds after ~2.2 seconds. IPN fixture burst: 40 requests =>
21 HTTP 200, 19 HTTP 429. These are timing-dependent leaky-bucket results, not proof
of a fixed 30-request rolling window.

Build warnings: old Browserslist data, admin/owner chunks above 500 kB, user references
missing /images/hero.jpg and /images/hero-fallback.jpg. No dependency or business source
was changed to hide those warnings. Source changes preserved in the original working tree
are deliberately not part of the pinned builds.

## Not verified / production gates

No server deployment, DNS/TLS/Tunnel change or real VNPay payment/callback test was made.
Actual Spring CORS with the new override is not exercised by the fixture; only its rendered
environment and edge/fixture preflight behavior are tested. Verify real backend in staging.
The previous local review found Spring CORS rejecting the three production Origins; no
running backend was reconfigured here. No authenticated API/role or cookie browser E2E
claim is made. Real IP is safe-default disabled until the exact Tunnel peer is verified.
IPN 120r/m burst 20 and polling/preflight 120r/m are provisional policies requiring traffic
and provider review. Health is Nginx liveness only. Secret checks do not constitute a full
arbitrary-secret, Git-history or CVE audit. Error-log redaction/observability needs review.
Push success will mean Git delivery only, not production readiness or deployment.
