---
description: Deploy the OptiThru (Throughput OS) application from GitHub as Docker containers on a host with macvlan networking, a dedicated IP address, and optional HTTPS via Let's Encrypt. Includes full stack setup, database migrations, mock data seeding, and verification.
tags: [deploy, docker, docker-compose, macvlan, infrastructure, setup, ssl, letsencrypt, https]
globs: ["**/docker-compose*", "**/Dockerfile*", "**/.env*"]
---

# Skill: Deploy OptiThru via Docker with Macvlan Networking

## When to Use
Use this skill when asked to deploy, set up, or instantiate OptiThru (Throughput OS) on a new host. This covers:
- Cloning the repo from GitHub
- Creating Dockerfiles for frontend and backend
- Generating a unified docker-compose.yml with macvlan networking
- HTTPS with automatic Let's Encrypt certificate via Certbot
- Frontend served at the domain URL (port 80/443)
- Applying database migrations and seeding mock data
- Verifying all services are running

## Prerequisites
The host must have:
- Docker Engine 24+ and Docker Compose v2
- Git
- Network interface for macvlan (e.g., `eth0`, `ens192`)
- A reserved IP address on the LAN for the app
- Internet access to pull images and clone the repo
- **For HTTPS:** A public domain with DNS A record pointing to `APP_IP` (or the host's public IP if behind NAT). Port 80 must be reachable from the internet for Let's Encrypt HTTP-01 challenge.

## Step 1: Collect Parameters

Before starting, ask the user for these values (provide defaults where shown):

| Parameter | Example | Default |
|-----------|---------|---------|
| `APP_IP` | `10.1.34.201` | *(required)* |
| `SUBNET` | `10.1.34.0/24` | *(required)* |
| `GATEWAY` | `10.1.34.1` | *(required)* |
| `HOST_INTERFACE` | `eth0` | `eth0` |
| `DOMAIN` | `optithru.example.com` | *(required for HTTPS)* |
| `LETSENCRYPT_EMAIL` | `admin@example.com` | *(required for HTTPS)* |
| `GITHUB_REPO` | `https://github.com/saptainc/optithru.git` | `https://github.com/saptainc/optithru.git` |
| `GITHUB_TOKEN` | `ghp_xxxx` | *(optional, for private repos)* |
| `DEPLOY_DIR` | `/opt/optithru` | `/opt/optithru` |

**If DOMAIN is not provided**, the app will be served on `http://<APP_IP>:3000` (HTTP only, no SSL). If DOMAIN is provided, the app will be served at `https://<DOMAIN>` with automatic Let's Encrypt certificates.

## Step 2: Clone the Repository

```bash
DEPLOY_DIR="/opt/optithru"
mkdir -p "$DEPLOY_DIR"

# For private repos, use token:
# git clone https://<TOKEN>@github.com/saptainc/optithru.git "$DEPLOY_DIR"
git clone https://github.com/saptainc/optithru.git "$DEPLOY_DIR"
cd "$DEPLOY_DIR"
```

## Step 3: Create Frontend Dockerfile

Write this file to `$DEPLOY_DIR/frontend/Dockerfile`:

```dockerfile
FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# Build args become env at build time
ARG NEXT_PUBLIC_SUPABASE_URL
ARG NEXT_PUBLIC_SUPABASE_ANON_KEY
ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_SUPABASE_URL=$NEXT_PUBLIC_SUPABASE_URL
ENV NEXT_PUBLIC_SUPABASE_ANON_KEY=$NEXT_PUBLIC_SUPABASE_ANON_KEY
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public
EXPOSE 3000
CMD ["node", "server.js"]
```

**IMPORTANT:** Add `output: 'standalone'` to `next.config.js` before building:

```js
// Add to the module.exports in next.config.js:
output: 'standalone',
```

## Step 4: Create Backend Dockerfile

Write this file to `$DEPLOY_DIR/backend/Dockerfile`:

```dockerfile
FROM python:3.12-slim

WORKDIR /app

# Install uv
RUN pip install uv

# Copy dependency files
COPY pyproject.toml uv.lock* ./

# Install dependencies
RUN uv sync --no-dev

# Copy application code
COPY . .

EXPOSE 8080

CMD ["uv", "run", "fastapi", "run", "app/main.py", "--port", "8080", "--host", "0.0.0.0"]
```

## Step 5: Generate the Unified docker-compose.yml

Write this to `$DEPLOY_DIR/docker-compose.yml`, substituting the user's parameters.

**If DOMAIN is provided**, the compose file includes a Certbot service and the nginx container listens on ports 80 and 443. **If no DOMAIN**, omit the certbot service and SSL-related nginx config.

```yaml
version: "3.8"

services:
  # ── Supabase PostgreSQL ──
  db:
    image: supabase/postgres:15.8.1.060
    restart: unless-stopped
    environment:
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
      POSTGRES_DB: postgres
      POSTGRES_HOST: /var/run/postgresql
    volumes:
      - db-data:/var/lib/postgresql/data
      - ./supabase/volumes/db/init:/docker-entrypoint-initdb.d:ro
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U supabase_admin -d postgres"]
      interval: 10s
      timeout: 5s
      retries: 10

  # ── Supabase Auth (GoTrue) ──
  auth:
    image: supabase/gotrue:v2.164.0
    restart: unless-stopped
    depends_on:
      db:
        condition: service_healthy
    environment:
      GOTRUE_API_HOST: 0.0.0.0
      GOTRUE_API_PORT: 9999
      API_EXTERNAL_URL: ${SUPABASE_EXTERNAL_URL}
      GOTRUE_DB_DRIVER: postgres
      GOTRUE_DB_DATABASE_URL: postgres://supabase_auth_admin:${POSTGRES_PASSWORD}@db:5432/postgres
      GOTRUE_SITE_URL: ${APP_URL}
      GOTRUE_URI_ALLOW_LIST: ${APP_URL}
      GOTRUE_DISABLE_SIGNUP: "false"
      GOTRUE_JWT_ADMIN_ROLES: service_role
      GOTRUE_JWT_AUD: authenticated
      GOTRUE_JWT_DEFAULT_GROUP_NAME: authenticated
      GOTRUE_JWT_EXP: 3600
      GOTRUE_JWT_SECRET: ${JWT_SECRET}
      GOTRUE_EXTERNAL_EMAIL_ENABLED: "true"
      GOTRUE_MAILER_AUTOCONFIRM: "true"
      GOTRUE_SMTP_ADMIN_EMAIL: admin@localhost
      GOTRUE_MAILER_URLPATHS_INVITE: /auth/v1/verify
      GOTRUE_MAILER_URLPATHS_CONFIRMATION: /auth/v1/verify
      GOTRUE_MAILER_URLPATHS_RECOVERY: /auth/v1/verify
      GOTRUE_MAILER_URLPATHS_EMAIL_CHANGE: /auth/v1/verify
    healthcheck:
      test: ["CMD-SHELL", "wget --no-verbose --tries=1 --spider http://localhost:9999/health || exit 1"]
      interval: 10s
      timeout: 5s
      retries: 5

  # ── Supabase PostgREST ──
  rest:
    image: postgrest/postgrest:v12.2.3
    restart: unless-stopped
    depends_on:
      db:
        condition: service_healthy
    environment:
      PGRST_DB_URI: postgres://authenticator:${POSTGRES_PASSWORD}@db:5432/postgres
      PGRST_DB_SCHEMAS: public,storage,graphql_public
      PGRST_DB_ANON_ROLE: anon
      PGRST_JWT_SECRET: ${JWT_SECRET}
      PGRST_DB_USE_LEGACY_GUCS: "false"
      PGRST_APP_SETTINGS_JWT_SECRET: ${JWT_SECRET}
      PGRST_APP_SETTINGS_JWT_EXP: 3600

  # ── Kong API Gateway ──
  kong:
    image: kong:2.8.1
    restart: unless-stopped
    depends_on:
      auth:
        condition: service_healthy
    environment:
      KONG_DATABASE: "off"
      KONG_DECLARATIVE_CONFIG: /var/lib/kong/kong.yml
      KONG_DNS_ORDER: LAST,A,CNAME
      KONG_PLUGINS: request-transformer,cors,key-auth,acl,basic-auth
      KONG_STATUS_LISTEN: 0.0.0.0:8001
      KONG_PROXY_LISTEN: 0.0.0.0:8000
    volumes:
      - ./supabase/volumes/kong/kong.yml:/var/lib/kong/kong.yml:ro
    healthcheck:
      test: ["CMD-SHELL", "kong health"]
      interval: 10s
      timeout: 5s
      retries: 5

  # ── Supabase Studio (Admin UI) ──
  studio:
    image: supabase/studio:20241202-4c1a189
    restart: unless-stopped
    depends_on:
      kong:
        condition: service_healthy
    environment:
      STUDIO_DEFAULT_ORGANIZATION: OptiThru
      STUDIO_DEFAULT_PROJECT: Default
      SUPABASE_PUBLIC_URL: ${SUPABASE_EXTERNAL_URL}
      SUPABASE_URL: http://kong:8000
      SUPABASE_REST_URL: ${SUPABASE_EXTERNAL_URL}/rest/v1/
      SUPABASE_ANON_KEY: ${ANON_KEY}
      SUPABASE_SERVICE_KEY: ${SERVICE_ROLE_KEY}
      AUTH_JWT_SECRET: ${JWT_SECRET}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
      LOGFLARE_API_KEY: dummy
      LOGFLARE_URL: http://localhost
      NEXT_PUBLIC_ENABLE_LOGS: "false"
      NEXT_ANALYTICS_BACKEND_PROVIDER: postgres

  # ── FastAPI Backend ──
  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    restart: unless-stopped
    depends_on:
      kong:
        condition: service_healthy
    environment:
      SUPABASE_URL: http://kong:8000
      SUPABASE_KEY: ${ANON_KEY}
      SUPABASE_SERVICE_KEY: ${SERVICE_ROLE_KEY}
      FRONTEND_URL: ${APP_URL}
      ENVIRONMENT: production

  # ── Next.js Frontend ──
  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
      args:
        NEXT_PUBLIC_SUPABASE_URL: ${SUPABASE_EXTERNAL_URL}
        NEXT_PUBLIC_SUPABASE_ANON_KEY: ${ANON_KEY}
        NEXT_PUBLIC_API_URL: ${APP_URL}
    restart: unless-stopped
    depends_on:
      - backend

  # ── Nginx Reverse Proxy (macvlan IP + SSL termination) ──
  nginx:
    image: nginx:alpine
    restart: unless-stopped
    depends_on:
      - frontend
      - backend
      - kong
      - studio
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf:ro
      - certbot-webroot:/var/www/certbot:ro
      - certbot-certs:/etc/letsencrypt:ro
    networks:
      default:
      optithru-macvlan:
        ipv4_address: ${APP_IP}

  # ── Certbot (Let's Encrypt certificate management) ──
  # Omit this service entirely if DOMAIN is not provided
  certbot:
    image: certbot/certbot:latest
    volumes:
      - certbot-webroot:/var/www/certbot
      - certbot-certs:/etc/letsencrypt
    entrypoint: /bin/sh -c 'trap exit TERM; while :; do sleep 12h & wait $${!}; certbot renew --webroot -w /var/www/certbot --quiet; done'

networks:
  default:
    driver: bridge
  optithru-macvlan:
    driver: macvlan
    driver_opts:
      parent: ${HOST_INTERFACE:-eth0}
    ipam:
      config:
        - subnet: ${SUBNET}
          gateway: ${GATEWAY}

volumes:
  db-data:
  certbot-webroot:
  certbot-certs:
```

## Step 6: Create Nginx Config

**If DOMAIN is provided**, write the HTTPS version. **If no DOMAIN**, write the HTTP-only version.

### Option A: With DOMAIN and SSL (HTTPS)

Write this to `$DEPLOY_DIR/nginx.conf`, replacing `<DOMAIN>` with the actual domain:

```nginx
worker_processes auto;
events { worker_connections 1024; }

http {
    resolver 127.0.0.11 valid=30s;

    # ── Redirect HTTP → HTTPS ──
    server {
        listen 80;
        server_name <DOMAIN>;

        # Let's Encrypt challenge
        location /.well-known/acme-challenge/ {
            root /var/www/certbot;
        }

        location / {
            return 301 https://$host$request_uri;
        }
    }

    # ── Main HTTPS server — frontend at domain root ──
    server {
        listen 443 ssl;
        server_name <DOMAIN>;

        ssl_certificate     /etc/letsencrypt/live/<DOMAIN>/fullchain.pem;
        ssl_certificate_key /etc/letsencrypt/live/<DOMAIN>/privkey.pem;
        ssl_protocols       TLSv1.2 TLSv1.3;
        ssl_ciphers         HIGH:!aNULL:!MD5;
        ssl_prefer_server_ciphers on;

        # Frontend — served at /
        location / {
            proxy_pass http://frontend:3000;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto https;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection "upgrade";
        }

        # FastAPI backend — proxied under /api/v1/
        location /api/v1/ {
            proxy_pass http://backend:8080/api/v1/;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-Proto https;
        }
    }

    # ── Supabase API — port 8000 (internal, not domain-routed) ──
    server {
        listen 8000;
        location / {
            proxy_pass http://kong:8000;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
        }
    }

    # ── FastAPI docs — port 8080 ──
    server {
        listen 8080;
        location / {
            proxy_pass http://backend:8080;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
        }
    }

    # ── Supabase Studio — port 3001 ──
    server {
        listen 3001;
        location / {
            proxy_pass http://studio:3000;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
        }
    }
}
```

### Option B: HTTP Only (no DOMAIN)

Write this to `$DEPLOY_DIR/nginx.conf`:

```nginx
worker_processes auto;
events { worker_connections 1024; }

http {
    resolver 127.0.0.11 valid=30s;

    # Frontend — port 3000
    server {
        listen 3000;
        location / {
            proxy_pass http://frontend:3000;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection "upgrade";
        }

        # API proxy to backend
        location /api/v1/ {
            proxy_pass http://backend:8080/api/v1/;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
        }
    }

    # Supabase API — port 8000
    server {
        listen 8000;
        location / {
            proxy_pass http://kong:8000;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
        }
    }

    # FastAPI docs — port 8080
    server {
        listen 8080;
        location / {
            proxy_pass http://backend:8080;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
        }
    }

    # Supabase Studio — port 3001
    server {
        listen 3001;
        location / {
            proxy_pass http://studio:3000;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
        }
    }
}
```

## Step 7: Create the .env File

> **CRITICAL — JWT_SECRET must match the demo keys.**
> The Supabase demo `ANON_KEY` and `SERVICE_ROLE_KEY` below are signed with the
> standard self-hosted secret `super-secret-jwt-token-with-at-least-32-characters-long`.
> If `JWT_SECRET` doesn't match, PostgREST returns `JWSError JWSInvalidSignature`
> on every backend service-key call (login works, but `/api/v1/*` calls fail).
> If you generate fresh keys for production, update both `JWT_SECRET` and the keys.

Write this to `$DEPLOY_DIR/.env`, substituting user parameters.

**If DOMAIN is provided**, set `APP_URL` and `SUPABASE_EXTERNAL_URL` to use the domain. **If no DOMAIN**, use IP-based URLs.

### With DOMAIN:
```bash
# ── Network ──
APP_IP=<USER_PROVIDED_IP>
SUBNET=<USER_PROVIDED_SUBNET>
GATEWAY=<USER_PROVIDED_GATEWAY>
HOST_INTERFACE=<USER_PROVIDED_INTERFACE>
DOMAIN=<USER_PROVIDED_DOMAIN>
LETSENCRYPT_EMAIL=<USER_PROVIDED_EMAIL>

# ── Application URLs (domain-based) ──
APP_URL=https://<DOMAIN>
SUPABASE_EXTERNAL_URL=http://<APP_IP>:8000

# ── Supabase Secrets ──
POSTGRES_PASSWORD=optithru-super-secret-postgres-password-2025
JWT_SECRET=super-secret-jwt-token-with-at-least-32-characters-long
ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0
SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU
```

### Without DOMAIN:
```bash
# ── Network ──
APP_IP=<USER_PROVIDED_IP>
SUBNET=<USER_PROVIDED_SUBNET>
GATEWAY=<USER_PROVIDED_GATEWAY>
HOST_INTERFACE=<USER_PROVIDED_INTERFACE>

# ── Application URLs (IP-based) ──
APP_URL=http://<APP_IP>:3000
SUPABASE_EXTERNAL_URL=http://<APP_IP>:8000

# ── Supabase Secrets ──
POSTGRES_PASSWORD=optithru-super-secret-postgres-password-2025
JWT_SECRET=super-secret-jwt-token-with-at-least-32-characters-long
ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0
SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU
```

## Step 8: Prepare Frontend for Standalone Build

Before building, patch `next.config.js` to enable standalone output:

```bash
cd "$DEPLOY_DIR/frontend"
# Add output: 'standalone' to next.config.js if not already present
```

Also update `allowedDevOrigins` in `next.config.js` to include the domain and IP:

```js
allowedDevOrigins: [
  'http://<APP_IP>:3000', 'http://<APP_IP>',
  'http://localhost:3000', 'http://localhost',
  // If DOMAIN is provided:
  'https://<DOMAIN>', 'http://<DOMAIN>', '<DOMAIN>',
],
```

## Step 9: Build and Start

```bash
cd "$DEPLOY_DIR"
docker compose build
docker compose up -d
```

Wait for all services to be healthy (~60–90 seconds):

```bash
docker compose ps
# All services should show "Up" / "healthy"
```

## Step 10: Obtain Let's Encrypt Certificate (HTTPS only)

**Skip this step if no DOMAIN was provided.**

First, start nginx with a temporary self-signed cert so Certbot can complete the HTTP-01 challenge. Or use the simpler approach — obtain the cert before starting the SSL server block:

```bash
# 1. Temporarily write an HTTP-only nginx.conf that serves the ACME challenge
#    (the port-80 server block from Option A above, without the 443 block)

# 2. Restart nginx to serve on port 80
docker compose restart nginx

# 3. Request the certificate
docker compose run --rm certbot certonly \
  --webroot \
  -w /var/www/certbot \
  -d <DOMAIN> \
  --email <LETSENCRYPT_EMAIL> \
  --agree-tos \
  --no-eff-email

# 4. Verify certificate was obtained
docker compose exec nginx ls /etc/letsencrypt/live/<DOMAIN>/
# Expected: cert.pem  chain.pem  fullchain.pem  privkey.pem

# 5. Now write the full HTTPS nginx.conf (Option A from Step 6)
#    and restart nginx
docker compose restart nginx
```

**Certificate auto-renewal:** The certbot service runs a renewal check every 12 hours. After renewal, restart nginx to pick up the new cert:

```bash
# Add to host crontab:
0 5 * * * cd /opt/optithru && docker compose exec nginx nginx -s reload
```

## Step 11: Apply Database Migrations

Once the database is healthy, apply the master migration:

```bash
docker compose exec -T db psql -U supabase_admin -d postgres \
  < supabase/migrations/apply-all-safe.sql
```

## Step 12: Seed Mock Data (Demo User + Organization + Products)

Run this SQL via the database container to create a demo environment:

```bash
docker compose exec -T db psql -U supabase_admin -d postgres <<'SEED_SQL'
-- ── Create demo organization ──
INSERT INTO public.organizations (id, name, slug)
VALUES ('a0000000-0000-0000-0000-000000000001', 'Shankara Naturals', 'shankara')
ON CONFLICT (id) DO NOTHING;

-- ── Seed sample products (Shankara Naturals catalog) ──
INSERT INTO public.product_variants (id, organization_id, product_name, category, sku, price, cogs, shipping_cost, inventory_quantity)
VALUES
  (gen_random_uuid(), 'a0000000-0000-0000-0000-000000000001', 'Kumkumadi Rejuvenating Oil', 'Face Care', 'SK-KUM-30ML', 85.00, 18.50, 5.00, 120),
  (gen_random_uuid(), 'a0000000-0000-0000-0000-000000000001', 'Hydrating Moisturizer', 'Face Care', 'SK-HYD-50ML', 42.00, 8.20, 4.50, 200),
  (gen_random_uuid(), 'a0000000-0000-0000-0000-000000000001', 'Calming Body Oil', 'Body Care', 'SK-CBO-100ML', 38.00, 7.80, 5.50, 85),
  (gen_random_uuid(), 'a0000000-0000-0000-0000-000000000001', 'Nourishing Shampoo', 'Hair Care', 'SK-NSH-250ML', 28.00, 5.40, 4.00, 310),
  (gen_random_uuid(), 'a0000000-0000-0000-0000-000000000001', 'Enriching Conditioner', 'Hair Care', 'SK-ECN-250ML', 28.00, 5.80, 4.00, 290),
  (gen_random_uuid(), 'a0000000-0000-0000-0000-000000000001', 'Soothing Face Cleanser', 'Face Care', 'SK-SFC-100ML', 32.00, 6.50, 4.50, 175),
  (gen_random_uuid(), 'a0000000-0000-0000-0000-000000000001', 'Timeless Anti-Aging Serum', 'Face Care', 'SK-TAS-30ML', 95.00, 22.00, 5.00, 60),
  (gen_random_uuid(), 'a0000000-0000-0000-0000-000000000001', 'Brightening Day Cream', 'Face Care', 'SK-BDC-50ML', 52.00, 11.00, 4.50, 140),
  (gen_random_uuid(), 'a0000000-0000-0000-0000-000000000001', 'Repairing Night Cream', 'Face Care', 'SK-RNC-50ML', 58.00, 13.50, 4.50, 95),
  (gen_random_uuid(), 'a0000000-0000-0000-0000-000000000001', 'Exfoliating Scrub', 'Body Care', 'SK-EXS-200ML', 34.00, 6.00, 5.00, 220),
  (gen_random_uuid(), 'a0000000-0000-0000-0000-000000000001', 'Sunscreen SPF 30', 'Face Care', 'SK-SS30-50ML', 36.00, 9.50, 4.50, 260),
  (gen_random_uuid(), 'a0000000-0000-0000-0000-000000000001', 'Lip Balm Trio', 'Lip Care', 'SK-LBT-3PK', 18.00, 3.20, 3.50, 450)
ON CONFLICT DO NOTHING;

-- ── Seed sample orders ──
DO $$
DECLARE
  v_org_id uuid := 'a0000000-0000-0000-0000-000000000001';
  v_variant RECORD;
  v_order_id uuid;
  v_channels text[] := ARRAY['DTC', 'Amazon', 'Wholesale', 'Email'];
  v_day integer;
BEGIN
  FOR v_day IN 1..30 LOOP
    FOR v_variant IN
      SELECT id, price, product_name FROM public.product_variants
      WHERE organization_id = v_org_id
      ORDER BY random() LIMIT (2 + floor(random() * 4)::int)
    LOOP
      v_order_id := gen_random_uuid();
      INSERT INTO public.orders (id, organization_id, order_number, order_date, total, channel, source)
      VALUES (
        v_order_id, v_org_id,
        'ORD-' || to_char(CURRENT_DATE - v_day, 'YYMMDD') || '-' || substr(v_order_id::text, 1, 4),
        (CURRENT_DATE - v_day)::timestamp,
        v_variant.price * (1 + floor(random() * 3)::int),
        v_channels[1 + floor(random() * array_length(v_channels, 1))::int],
        'seed'
      ) ON CONFLICT DO NOTHING;

      INSERT INTO public.order_line_items (id, order_id, product_variant_id, quantity, unit_price)
      VALUES (
        gen_random_uuid(), v_order_id, v_variant.id,
        1 + floor(random() * 3)::int,
        v_variant.price
      ) ON CONFLICT DO NOTHING;
    END LOOP;
  END LOOP;
END $$;

-- ── Seed marketing spend ──
INSERT INTO public.marketing_spend (id, organization_id, channel, period_start, period_end, spend, revenue_attributed, conversions)
VALUES
  (gen_random_uuid(), 'a0000000-0000-0000-0000-000000000001', 'email', CURRENT_DATE - 30, CURRENT_DATE, 500, 18000, 120),
  (gen_random_uuid(), 'a0000000-0000-0000-0000-000000000001', 'meta_ads', CURRENT_DATE - 30, CURRENT_DATE, 8000, 22000, 85),
  (gen_random_uuid(), 'a0000000-0000-0000-0000-000000000001', 'google_ads', CURRENT_DATE - 30, CURRENT_DATE, 6000, 19500, 70),
  (gen_random_uuid(), 'a0000000-0000-0000-0000-000000000001', 'organic_social', CURRENT_DATE - 30, CURRENT_DATE, 200, 4500, 30),
  (gen_random_uuid(), 'a0000000-0000-0000-0000-000000000001', 'affiliate', CURRENT_DATE - 30, CURRENT_DATE, 1500, 7200, 45)
ON CONFLICT DO NOTHING;

-- ── Seed active constraint ──
INSERT INTO public.constraints (id, organization_id, name, type, capacity, is_active)
VALUES (gen_random_uuid(), 'a0000000-0000-0000-0000-000000000001', '2oz Liquid Filling Machine', 'production_capacity', 480, true)
ON CONFLICT DO NOTHING;

-- ── Seed 30 days of snapshots for trend chart ──
DO $$
DECLARE
  v_org uuid := 'a0000000-0000-0000-0000-000000000001';
  v_day integer;
  v_t numeric; v_oe numeric; v_inv numeric;
BEGIN
  FOR v_day IN REVERSE 30..1 LOOP
    v_t   := 85000 + (random() * 15000)::numeric;
    v_oe  := 28000 + (random() * 8000)::numeric;
    v_inv := 40000 + (random() * 10000)::numeric;
    INSERT INTO public.toc_snapshots (id, organization_id, snapshot_date, total_throughput, net_profit, total_inventory, total_operating_expense)
    VALUES (gen_random_uuid(), v_org, CURRENT_DATE - v_day, v_t, v_t - v_oe, v_inv, v_oe)
    ON CONFLICT DO NOTHING;
  END LOOP;
END $$;
SEED_SQL
```

Then create the demo user via the auth API:

```bash
# Use DOMAIN URL if available, otherwise IP:8000
AUTH_URL="${APP_URL:-http://<APP_IP>:8000}"

curl -s -X POST "${SUPABASE_EXTERNAL_URL}/auth/v1/signup" \
  -H "apikey: <ANON_KEY>" \
  -H "Content-Type: application/json" \
  -d '{"email":"demo@optithru.com","password":"demo1234"}'
```

After signup, link the user to the organization:

```bash
docker compose exec -T db psql -U supabase_admin -d postgres -c "
  INSERT INTO public.organization_members (user_id, organization_id, role)
  SELECT id, 'a0000000-0000-0000-0000-000000000001', 'owner'
  FROM auth.users WHERE email = 'demo@optithru.com'
  ON CONFLICT DO NOTHING;
"
```

## Step 13: Configure Host Macvlan Access (Optional)

If the Docker host itself needs to reach the macvlan IP, create a shim interface:

```bash
sudo ip link add optithru-shim link <HOST_INTERFACE> type macvlan mode bridge
sudo ip addr add <HOST_IP>/32 dev optithru-shim
sudo ip link set optithru-shim up
sudo ip route add <APP_IP>/32 dev optithru-shim
```

## Step 14: Verify Deployment

### With DOMAIN (HTTPS):
```bash
# Frontend at domain root
curl -s -o /dev/null -w "%{http_code}" https://<DOMAIN>
# Expected: 200

# HTTP → HTTPS redirect
curl -s -o /dev/null -w "%{http_code}" http://<DOMAIN>
# Expected: 301

# SSL certificate check
echo | openssl s_client -connect <DOMAIN>:443 -servername <DOMAIN> 2>/dev/null | openssl x509 -noout -dates
# Expected: notBefore/notAfter dates from Let's Encrypt

# Backend health (via domain)
curl -s https://<DOMAIN>/api/v1/healthz
# Expected: {"status":"ok"}

# Supabase API (via IP)
curl -s http://<APP_IP>:8000/rest/v1/ -H "apikey: <ANON_KEY>"
# Expected: JSON response

# Supabase Studio
curl -s -o /dev/null -w "%{http_code}" http://<APP_IP>:3001
# Expected: 200
```

### Without DOMAIN (HTTP):
```bash
curl -s -o /dev/null -w "%{http_code}" http://<APP_IP>:3000
curl -s http://<APP_IP>:8080/api/v1/healthz
curl -s http://<APP_IP>:8000/rest/v1/ -H "apikey: <ANON_KEY>"
curl -s -o /dev/null -w "%{http_code}" http://<APP_IP>:3001
```

## Access URLs

### With DOMAIN:
| Service | URL | Purpose |
|---------|-----|---------|
| Frontend | `https://<DOMAIN>` | Main application (SSL) |
| Frontend (redirect) | `http://<DOMAIN>` | Redirects to HTTPS |
| Backend API | `https://<DOMAIN>/api/v1/` | API via domain |
| FastAPI Docs | `http://<APP_IP>:8080/docs` | API documentation |
| Supabase API | `http://<APP_IP>:8000` | REST + Auth API |
| Supabase Studio | `http://<APP_IP>:3001` | Database admin UI |

### Without DOMAIN:
| Service | URL | Purpose |
|---------|-----|---------|
| Frontend | `http://<APP_IP>:3000` | Main application |
| FastAPI Docs | `http://<APP_IP>:8080/docs` | API documentation |
| Supabase API | `http://<APP_IP>:8000` | REST + Auth API |
| Supabase Studio | `http://<APP_IP>:3001` | Database admin UI |

## Demo Credentials

| Field | Value |
|-------|-------|
| Email | `demo@optithru.com` |
| Password | `demo1234` |
| Organization | Shankara Naturals |

## SSL Certificate Renewal

Let's Encrypt certificates expire every 90 days. The certbot container auto-renews every 12 hours. To ensure nginx picks up renewed certs, add a cron job on the host:

```bash
# Add to crontab (crontab -e):
0 5 * * * cd /opt/optithru && docker compose exec -T nginx nginx -s reload 2>/dev/null
```

To manually force renewal:
```bash
docker compose run --rm certbot renew --force-renewal
docker compose exec nginx nginx -s reload
```

## Troubleshooting

| Issue | Fix |
|-------|-----|
| `macvlan: address already in use` | The IP is taken on the LAN — pick another |
| `no matching manifest for linux/arm64` | Some Supabase images are amd64-only — run on x86 host |
| DB migrations fail | Ensure `db` container is healthy: `docker compose exec db pg_isready` |
| Frontend can't reach API | Check `nginx.conf` proxy_pass targets match service names |
| Auth signup returns 500 | GoTrue needs healthy db — wait and retry |
| `next.config.js` must be .js | Never rename to `.ts` — Next.js 16 requires CommonJS |
| Certbot fails `HTTP-01 challenge` | Ensure port 80 is reachable from the internet; check DNS A record points to `APP_IP` |
| `ssl_certificate not found` | Run certbot first (Step 10) before enabling the 443 server block |
| Certificate renewal fails | Check `docker compose logs certbot`; ensure webroot volume is shared |
| `ERR_SSL_PROTOCOL_ERROR` | Certificate not yet obtained — complete Step 10 first |
| `JWSError JWSInvalidSignature` from PostgREST | `JWT_SECRET` doesn't match the demo keys. Use `super-secret-jwt-token-with-at-least-32-characters-long`. Restart `auth`, `rest`, `kong`, `backend` after fixing. |
| Frontend login works but `/api/v1/*` returns 500 | Same as above — JWT_SECRET mismatch. The backend's Supabase client uses the SERVICE_KEY which fails verification at PostgREST. |
| Backend has stale config after `.env` change | Backend caches settings via `@lru_cache`. Always `docker compose restart backend` after editing `.env`. |
| Kong returns 502 after restarting `auth` | Kong has cached the old container's DNS. Run `docker compose restart kong` after recreating `auth`. |

## Next: Fizzy TOC Kanban Integration

Once OptiThru is deployed and bootstrap is complete, see the
**`fizzy-optithru-integration`** skill to add the Fizzy Strategic Kanban
on its own subdomain (e.g., `kanbanshankara.sapta.com`) with SSO.

For a fresh redeploy from a clean checkout, use the bootstrap script:

```bash
git clone --recurse-submodules https://github.com/saptainc/optithru.git $DEPLOY_DIR
cd $DEPLOY_DIR
cp .env.example .env
# Edit .env with real secrets (generate FIZZY_EMBED_SECRET and SECRET_KEY_BASE
# with `openssl rand -hex 32` and `openssl rand -hex 64`)
docker compose build
docker compose up -d
./bootstrap.sh
# Then trigger first SSO from the browser and follow the printed Fizzy steps.
```
