# Hoi An frontend Docker deployment

## Repository boundary and source provenance

This is a **configuration-only** branch based on `origin/hostfix` commit
`00771658122f2e46b931ff1e4199b76a122f7fd3`. That base contains UniMate, not Hoi An.
No Hoi An Java/React business source is imported into this branch.
`deploy/frontend/prepare_source.py` materializes frontend files from the immutable Git
commit `42d982969a3a656131ebaf0864678f69042e6313` into a new directory under /tmp.
It skips all .env files, node_modules, dist and .git **before writing**, rejects unsafe
archive paths/links and overlays only the three reviewed Docker/static configurations.
No stash or dirty working-tree business changes enter the build. The manifest records
which source revision was used. This dependency is deliberate: a deployment-only checkout
cannot build missing application source without retrieving the pinned snapshot.

Clone with sufficient Git history. If the pinned commit is missing, fetch the feature
history (or the exact revision if the Git server permits it), then retry. Do not change
the revision silently, merge unrelated histories, or copy dirty source to make a build pass.
The original feature/review working tree and Data_Storage are outside this process.

## Images and static frontends

Each of HA.USER/hoi-an-app, HA_ADMIN and HA_Store Owner contains only Dockerfile,
.dockerignore and nginx.conf on this branch. Build context comes from the materialized
snapshot. Node 22.22.0 Alpine runs npm ci and npm run build with the existing lockfiles;
no host Node installation or dependency upgrades. Runtime is nginx:1.28.2-alpine,
USER nginx, daemon off, read-only filesystem, tmpfs /tmp, dropped capabilities and
no-new-privileges. The low-port sysctl affects only the container namespace.
Runtime copies dist and Nginx configuration, not the app source/node_modules/.env.
Pin image digests and review security patches before a release; version tags alone are
not immutable supply-chain verification.

All three existing API configuration mechanisms accept VITE_API_BASE_URL. The Dockerfiles
require `https://api.buivietquangvinh.xyz` at **build time**. No secrets belong in VITE_*
values: the browser can read them. Runtime environment changes do not rewrite a Vite bundle.

Vite base is / for each app. Main navigation in the pinned snapshot uses React state;
SPA fallback supports refresh and deep links but does not create business routes.
/api and /api/* on a frontend return 404, never index.html. Missing assets return 404.
Dotfiles and sensitive configuration extensions are blocked; directory listing is off.
MIME uses Nginx's standard table. Hashed /assets files are immutable for a year,
other emitted static files cache one hour, index.html is no-store. Keep old hashed assets
available during a rolling release if a previous browser session needs them.
/healthz is unthrottled **Nginx liveness**, not Spring/database readiness.

## Networks and hostname routing

Cloudflare -> existing Tunnel -> hoian-edge:80 -> frontends or existing app:8080.

| Host | Target |
|---|---|
| ha-user.buivietquangvinh.xyz | hoian-frontend-user:80 |
| ha-admin.buivietquangvinh.xyz | hoian-frontend-admin:80 |
| ha-owner.buivietquangvinh.xyz | hoian-frontend-owner:80 |
| api.buivietquangvinh.xyz | app:8080 |

Production compose.yml publishes no host ports. Frontends participate only in the internal
frontend network. Edge also joins external hoian_ingress and hoian_api_edge. App and
edge share API edge; existing Tunnel and edge share ingress. Backend data network remains
separate. Frontends receive no PostgreSQL/Redis credentials or network membership.
DNS resolution is refreshed through Docker DNS. No extra backend/Tunnel is created.

backend.integration.example.yml and backend.cors.production.yml are **unapplied overlays**
for the operator's existing backend stack. The first adds networks while preserving the
backend network. The latter sets only the three exact HTTPS frontend Origins; no wildcard.
Applying these overlays can recreate app/Tunnel and requires a separately approved server
change window. This repository does not deploy them or change existing .env files.

## Local test safety

Run from the deployment checkout root:

```bash
python3 deploy/frontend/tests/run.py
```

The runner accepts only a local Unix Docker endpoint, prepares an immutable source snapshot,
generates a new `hoian-deploy-test-<random>` project and `test-<random>` image tag, renders
and validates the standalone compose.local.yml before building/running it. Every network
is project scoped and internal. There are no fixed container names, published host ports,
bind mounts or data volumes. Existing containers are not stopped/restarted or attached.

The fixture service is **hoian-api-fixture**, with DNS alias app only inside that project's
API network. It cannot override backend service app. compose.local.yml is standalone:
never combine it with the backend or production Compose. The regression test checks the
real pinned backend Compose and validates that image/build/command/ports/data volumes are
preserved when legitimate production overlays are rendered. A wrong merge is rejected or
must preserve backend image/build. This is tested without running a backend.

The runner tests four virtual hosts, static MIME/cache, SPA fallback, Nginx syntax,
health, image contents, production API URL, client-IP separation, spoofed headers,
429 CORS, bounded polling/IPN and preflight. It retains newly created test containers
and prints a test-state.json path under the source directory for inspection. If rerunning,
use a new project; do not restart the original stack to clear buckets. To stop only a test
project after review, reconstruct its exact project/tag/source values from that state and
use compose stop on compose.local.yml. Never down -v, prune or delete data volumes.

## Rate limiting and CORS

Nginx uses leaky bucket, **not an exact 30-per-every-60-seconds sliding counter**.
The ordinary API bucket uses client IP, 30r/m, burst 5 nodelay: a fresh bucket can admit
about 6 immediate requests; capacity recovers about one request every 2 seconds. Burst
allows short-term traffic beyond the steady rate. Counts depend on timing.

| Traffic | Finite policy |
|---|---|
| Ordinary API, uploads, unrecognized API-host paths | 30r/m burst 5 |
| Login/register | ordinary policy plus 10r/m burst 3 |
| /api/payments and /api/payments/claim | ordinary policy plus shared 10r/m burst 2 |
| /api/payments/<ref>/status | separate 120r/m burst 10 |
| OPTIONS on ordinary/auth/payment routes | separate 120r/m burst 20 |
| Exact /api/payments/vnpay/ipn | separate 120r/m burst 20, provisional |
| Static and exact /healthz | no ordinary API limiter |

Ordinary/sensitive keys are empty for OPTIONS; OPTIONS still has its own finite bucket,
so successful preflight does not consume a login/payment attempt quota. Polling and IPN
locations have independent finite policies for all methods. No query-string/signature
parameter grants a bypass. Other path forms fall back to ordinary limits; normalize and
test any alternate Spring path acceptance before relying on a sensitive-route restriction.
One 3-second polling tab generates ~20 requests/min; two tabs ~40. The separate polling
bucket avoids consuming the ordinary budget, but shared NAT can still aggregate clients.
Changing these policies requires only Nginx configuration and image rebuild/recreate.

The API edge owns Access-Control-Allow-Origin/Credentials to avoid duplicate upstream
headers. Only the three exact production Origins receive them, including Nginx 429.
Backend still determines valid preflight methods/headers and must allow the same Origins.
A 429 has a JSON message and Retry-After: 6 as a conservative hint, not a reservation of
capacity. A rejected preflight can still appear as a browser network error. No wildcard
Origin, unbounded exemption or business authentication change is introduced.

## VNPay IPN

Endpoint is GET /api/payments/vnpay/ipn. 120r/m burst 20 is a provisional staging
candidate, not vendor-certified throughput. It is implemented/tested only in local fixtures;
no production configuration or real callback is changed by this work. Confirm provider
sender aggregation, peak volume and retry behavior before server adoption.
Nginx cannot validate payment signatures; the backend retains HMAC-SHA512 verification,
merchant/order/amount validation, transaction locking and duplicate-state handling.
No signature presence or guessed provider IP grants an exemption.

Official VNPay docs describe JSON RspCode 00/02 ending retries and 01/04/97/99 or timeout
causing retries, up to 10 calls spaced 5 minutes. Do not assume an HTML/JSON Nginx HTTP 429
has identical provider semantics; confirm it in sandbox with the provider. Review recovery
when Redis fails after payment transaction commit in a separate test environment.

## Real IP and logging

The checked-in trusted-proxies.conf trusts no one: direct local tests use real TCP peer IPs.
For production, verify the exact cloudflared address on a dedicated ingress network,
then configure set_real_ip_from for that address /32 (or /128) and real_ip_header
CF-Connecting-IP. Never trust 0.0.0.0/0, all Docker networks or arbitrary X-Forwarded-For.
The direct peer is cloudflared, not a Cloudflare edge CIDR. No Cloudflare CIDR list is
needed for this Tunnel-to-container hop. If architecture changes, use only the official
Cloudflare IP list, https://www.cloudflare.com/ips/.

Without verified Real IP all Tunnel visitors share one bucket. With it, real shared NAT
still shares a bucket. Use two independent egress networks (Wi-Fi/mobile) after separately
approving production smoke tests. Verify client and peer IP log fields and spoof resistance.
Inspect Workers, Pseudo IPv4 and Managed Transforms; do not assume headers survive unchanged.
Backend APP_PROXY_TRUSTED_PROXIES must trust the exact new edge peer if payment client-IP
resolution should use sanitized XFF. No backend environment is changed automatically here.

Logs contain timestamp, fixed vhost/route group, client/peer IP, status, limiter/upstream
status and timing; no request URI/query, tokens, passwords or payment payload. Nginx error
logging stays off because raw errors can include signed query strings. This loses diagnostics:
review a redacted logging pipeline and rotation/retention before production. Monitor 429
per group, latency, upstream errors, health, preflight failures and delayed payment completion.
Body upload limit is 20 MB and needs a product-specific review.

## Production preparation and rollback (not executed)

1. Review the configuration-only diff and pinned source. Use an explicit immutable release
   tag distinct from local test tags. Preserve previous images/config for rollback.
2. Materialize source with `python3 deploy/frontend/prepare_source.py`. Export its printed
   directory as HOIAN_BUILD_ROOT and an explicit release tag as FRONTEND_TAG in the shell;
   do not store secrets in either. Render compose.yml with --env-file /dev/null and build
   using the production file alone. Do not run the test Compose on the server.
3. On the server, verify the actual backend checkout/project, subnet/port/name collisions
   and current Tunnel routes. This config-only branch does not contain a backend to start.
4. Separately approve/create ingress/API edge networks, stabilize and verify Tunnel IP,
   apply reviewed backend network/CORS overlays to the EXISTING backend project only.
   Keep its real data paths and .env; validate rendered image/build/ports/volumes first.
5. Configure Real IP and backend trusted proxy, rebuild edge, start the frontend production
   stack with the explicit release tag. Verify API DNS/connectivity, credentials/cookies,
   preflight, role authorization, uploads/audio and health before changing public routes.
6. After operator approval, point the existing Tunnel's four routes to http://hoian-edge:80.
   Preserve the incoming hostname; check HTTP Host Header overrides. Do not create a second
   Tunnel. Check that no alternate API route/public port bypasses the limiter.
7. Run separately approved smoke/sandbox tests; production DNS/TLS/Tunnel, live CORS and IP
   correctness have not been verified by local fixtures. User hero asset warnings remain
   source issues, not reasons to silently edit React/CSS during deployment work.

Rollback: restore the previous explicit image tags/config and recreate only the approved
frontend project. Never rebuild an old mutable release tag. For first cutover failures,
restore the four saved Tunnel service URLs through the operator; direct API rollback loses
edge rate protection and must be recorded. Never reset user source, change schema, delete
volumes or roll back PostgreSQL/Redis data as part of this frontend rollback.

## Official references

- https://nginx.org/en/docs/http/ngx_http_limit_req_module.html
- https://nginx.org/en/docs/http/ngx_http_realip_module.html
- https://developers.cloudflare.com/fundamentals/reference/http-headers/
- https://sandbox.vnpayment.vn/apis/docs/thanh-toan-pay/pay.html
