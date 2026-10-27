# Docker deployment

This guide covers the Spring Boot API and its current runtime dependencies. The React applications are separate Vite projects and are not built or served by this Compose stack. No Nginx configuration existed in the repository; the VPS section below uses host Nginx as a reverse proxy.

## Services and persistence

`docker-compose.yml` runs the Spring Boot app, PostgreSQL, Redis, LibreTranslate and the existing Piper TTS service on one private Docker bridge network. PostgreSQL, Redis and the Backend are published only on loopback for host-side development or a host Nginx proxy. LibreTranslate and Piper have no published host ports.

- PostgreSQL data persists in the `postgres_data` named volume.
- Redis data persists in `redis_data`.
- LibreTranslate models persist in `libretranslate_models`.
- Uploaded audio and images persist in the host `Data_Storage/` directory mounted into the Backend.
- Piper models are mounted read-only from `tts-service/models/`; the TTS image does not bundle model weights.

The current Compose file mounts `hoian_database.sql` as a PostgreSQL initialization script. The PostgreSQL image runs initialization scripts only when the data directory is empty. The SQL file contains destructive `DROP ... CASCADE` statements, so use it only for a new, empty volume. Never use `docker compose down -v` on a database whose data must be retained. Changing `POSTGRES_USER` or `POSTGRES_PASSWORD` in `.env` does not change credentials inside an already initialized volume; the values must match the existing database or be changed through a separately planned PostgreSQL operation.

## Prepare local environment

Run these commands from `HA_App/`:

```sh
test -f .env || cp .env.example .env
```

Edit `.env` and set `POSTGRES_PASSWORD`, `REDIS_PASSWORD`, `JWT_SECRET`, `APP_SUPER_ADMIN_PASSWORD` and `APP_SEED_MERCHANT_PASSWORD`. Use unique values. Generate a JWT secret with:

```sh
openssl rand -hex 32
```

Set `APP_UID` and `APP_GID` to the numeric owner of `Data_Storage/` on the Docker host, for example:

```sh
stat -c '%u %g' Data_Storage
```

The Backend image runs as this non-root numeric user. Ensure that user can write to `Data_Storage/` on the host before starting the service. Do not change directory ownership blindly on an existing data directory.

For VNPAY Sandbox, put credentials issued by the Sandbox account in `VNPAY_TMN_CODE` and `VNPAY_HASH_SECRET`. Configure `VNPAY_RETURN_URL` as the existing application flow expects. The externally registered IPN URL must resolve publicly over HTTPS to `/api/payments/vnpay/ipn`; also register it in the VNPAY merchant configuration. `application.properties` maps the external `VNPAY_PAYMENT_URL` variable to the canonical `vnpay.pay-url` key used by `VnPayProperties.payUrl`.

When using a reverse proxy, set `APP_PROXY_TRUSTED_PROXIES` to the IP/CIDR of the peer address the Backend actually sees for that proxy connection. Prefer a single exact IP (`/32` for IPv4 or `/128` for IPv6). Do not use `0.0.0.0/0` or `::/0`. With this setting empty, forwarded headers are ignored and the app uses the socket peer IP. The configured proxy must set/append `X-Forwarded-For`; the app walks that chain from right to left and stops at the first untrusted address.

Validate the resolved Compose model without printing interpolated secrets:

```sh
docker compose config -q
```

Then build and start:

```sh
docker compose up -d --build
docker compose ps
docker compose logs --tail=100 app postgres redis piper-tts libretranslate
```

The API is reachable from the host at `http://127.0.0.1:9999`. PostgreSQL is available to local tools at `127.0.0.1:5433`; internal containers use service DNS names and container ports (`postgres:5432`, `redis:6380`, `libretranslate:5000`, `piper-tts:5001`). Redis uses the configured password. LibreTranslate and Piper are not exposed on host ports.

Useful operations:

```sh
docker compose restart app
docker compose build app piper-tts
docker compose logs -f app
docker compose stop
```

`docker compose down` also retains named volumes unless `-v` is supplied. Do not use `-v` for routine stops or rebuilds.

## Backend health and first-start checks

There is no Spring Actuator dependency or Backend health endpoint in the current application, so Compose does not claim a Backend healthcheck. PostgreSQL and Redis have readiness checks; Piper checks that all configured models and phonemizers are available. LibreTranslate is ordered before the app but currently has no healthcheck. After startup, inspect `docker compose ps` and the app logs, then verify an existing read-only API such as `GET /api/poi/locations` through `http://127.0.0.1:9999`.

The app uses `spring.jpa.hibernate.ddl-auto=validate`; the Compose file does not run migrations. It waits for PostgreSQL to become healthy before starting. This does not prove that an existing database schema matches the current entities.

## Backup and restore

Create a PostgreSQL custom-format backup and a separate archive of uploaded files:

```sh
docker compose exec -T postgres sh -c 'pg_dump -Fc -U "$POSTGRES_USER" "$POSTGRES_DB"' > "hoian-db-$(date +%F).dump"
tar -czf "hoian-files-$(date +%F).tar.gz" Data_Storage
```

Keep backups outside the repository and protect them as sensitive data. To verify a backup without overwriting the live database, restore it into a separately created empty database, then compare expected tables and records. Do not use `pg_restore --clean` against the live database without an approved recovery plan. Test backup and restore before moving an existing PostgreSQL database into Docker.

## VPS and host Nginx

The Backend port is bound to `127.0.0.1:9999`; a host Nginx process can proxy to it without exposing the Java port publicly. Configure DNS `A`/`AAAA` records to the VPS, allow inbound TCP 80/443 in the firewall, install Nginx and Certbot on the host, and obtain a certificate for the real API hostname. Do not use the placeholder hostname below as a real domain.

Example HTTP site before enabling TLS:

```nginx
server {
    listen 80;
    server_name api.example.invalid;
    client_max_body_size 55m;

    location / {
        proxy_pass http://127.0.0.1:9999;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 240s;
    }
}
```

Replace `api.example.invalid`, validate/reload Nginx, then use Certbot's Nginx integration to obtain and install HTTPS. Set `CORS_ALLOWED_ORIGINS` to the actual HTTPS origins of the deployed Web frontends. Set the VNPAY return/IPN URLs to the real public URLs and register the IPN URL with VNPAY. DNS, firewall, certificate issuance and merchant-account configuration are external to Docker and are not performed by this project configuration.

**VNPAY client IP:** `PaymentController` uses `getRemoteAddr()` unless that socket peer matches `APP_PROXY_TRUSTED_PROXIES`. Only then does it inspect `X-Forwarded-For`; malformed chains fall back to the socket peer. Verify the exact peer address in the target Docker/VPS network and configure only that trusted proxy. Forwarded headers from direct/untrusted connections are ignored.

## Secrets and operational limits

- `.env` is ignored by Git; `.dockerignore` excludes it from build contexts. Do not commit it, print the resolved Compose configuration, or put credentials in a Dockerfile.
- Compose passes runtime values as environment variables. Docker administrators can inspect container environment; use a secret manager or Docker secrets mechanism for a production environment that requires stronger secret isolation.
- The application properties now require runtime values for the database password, Redis password, JWT secret and Super Admin seed password; Compose supplies these from `.env`. The merchant and Super Admin seeder classes still contain code-level fallback password literals, although Compose requires and supplies the configured values. Removing those fallback literals requires a separate Java change and is not part of this Docker configuration.
- The code's IP handling behind reverse proxies and any VNPAY-specific validation must be verified with the actual Sandbox account and public HTTPS endpoint.
- This Compose stack does not deploy the Vite frontend, configure DNS/firewall, issue certificates, or configure VNPAY merchant settings.
