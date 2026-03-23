# Throughput OS: Claude Code setup prompt for Ubuntu

## How to use this document

This file contains **one monolithic prompt** you paste into Claude Code on a fresh Ubuntu box. It handles everything: system dependencies, local Supabase via Docker, Next.js frontend, FastAPI backend, database schema with RLS, auth flow, and the dashboard shell — all wired together and working.

**Prerequisites on your Ubuntu box:**
- Ubuntu 22.04+ (fresh or existing)
- At least 4GB RAM (Supabase containers need ~2GB)
- Docker and Docker Compose installed
- A user with sudo access

**If Docker isn't installed yet, run this first:**
```bash
curl -fsSL https://get.docker.com | sudo sh
sudo usermod -aG docker $USER
newgrp docker
```

**Then install Claude Code:**
```bash
curl -fsSL https://claude.ai/install.sh | bash
```

**Start Claude Code and paste the entire prompt below:**
```bash
mkdir -p ~/throughput-os && cd ~/throughput-os
claude
```

---

## The prompt

Copy everything between the `---START---` and `---END---` markers below and paste it into Claude Code as a single prompt.

---START---

I need you to build the complete foundation for "Throughput OS" — a SaaS platform that applies Theory of Constraints / Throughput Accounting to help beauty e-commerce brands maximize profitability. Set up the full stack on this Ubuntu box: local Supabase via Docker, Next.js 15 frontend, and FastAPI backend — all wired together and working.

Follow these instructions precisely, in order. Do not skip steps. Verify each major step works before moving to the next.

## PHASE 1: System dependencies

1. Install Node.js 20 LTS via nvm (if not present):
```bash
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.1/install.sh | bash
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
nvm install 20
nvm use 20
```

2. Install Python 3.12+ via deadsnakes PPA (if not present):
```bash
sudo add-apt-repository ppa:deadsnakes/ppa -y
sudo apt update
sudo apt install -y python3.12 python3.12-venv python3.12-dev
```

3. Install uv (Rust-based Python package manager):
```bash
curl -LsSf https://astral.sh/uv/install.sh | sh
source $HOME/.local/bin/env 2>/dev/null || export PATH="$HOME/.local/bin:$PATH"
```

4. Verify Docker is running:
```bash
docker info > /dev/null 2>&1 || (echo "ERROR: Docker not running" && exit 1)
```

## PHASE 2: Local Supabase via Docker Compose

Create the entire local Supabase stack using Docker. This replaces the Supabase CLI approach and gives us full control.

5. Create the project structure:
```
throughput-os/
├── supabase/
│   ├── docker-compose.yml
│   ├── volumes/
│   │   ├── db/
│   │   │   └── init/
│   │   │       ├── 00-schema.sql
│   │   │       ├── 01-auth-schema.sql
│   │   │       └── 02-seed.sql
│   │   └── storage/
│   └── .env
├── frontend/
├── backend/
└── CLAUDE.md
```

6. Create `supabase/.env` with these values:
```env
# Secrets — change in production
POSTGRES_PASSWORD=your-super-secret-and-long-postgres-password
JWT_SECRET=your-super-secret-jwt-token-with-at-least-32-characters-long
ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0
SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU
DASHBOARD_USERNAME=supabase
DASHBOARD_PASSWORD=this_password_is_insecure_and_should_be_updated

# URLs
SITE_URL=http://localhost:3000
API_EXTERNAL_URL=http://localhost:8000
SUPABASE_PUBLIC_URL=http://localhost:8000

# Ports
KONG_HTTP_PORT=8000
KONG_HTTPS_PORT=8443
POSTGRES_PORT=5432
STUDIO_PORT=3001
```

7. Create `supabase/docker-compose.yml` with these services. Use the official Supabase Docker images. The compose file must include:

- **db** (supabase/postgres:15.8.1.060): PostgreSQL with the auth and storage schemas pre-configured. Mount `volumes/db/init/` to `/docker-entrypoint-initdb.d/` so our SQL files run on first start. Expose port ${POSTGRES_PORT}:5432. Set POSTGRES_PASSWORD, POSTGRES_DB=postgres, POSTGRES_HOST=/var/run/postgresql. Health check: `pg_isready -U supabase_admin -d postgres`

- **kong** (kong:2.8.1): API gateway that routes to all services. Expose ${KONG_HTTP_PORT}:8000. Depends on auth. Use declarative config via KONG_DECLARATIVE_CONFIG. Mount a kong.yml config file. Environment: KONG_DATABASE=off, KONG_DNS_ORDER=LAST,A,CNAME, KONG_PLUGINS=request-transformer,cors,key-auth,acl,basic-auth. Health check: `kong health`

- **auth** (supabase/gotrue:v2.164.0): GoTrue auth server. Expose 9999 internally. Environment must include:
  - GOTRUE_API_HOST=0.0.0.0
  - GOTRUE_API_PORT=9999
  - API_EXTERNAL_URL=${API_EXTERNAL_URL}
  - GOTRUE_DB_DRIVER=postgres
  - GOTRUE_DB_DATABASE_URL=postgres://supabase_auth_admin:${POSTGRES_PASSWORD}@db:5432/postgres
  - GOTRUE_SITE_URL=${SITE_URL}
  - GOTRUE_URI_ALLOW_LIST=${SITE_URL}
  - GOTRUE_DISABLE_SIGNUP=false
  - GOTRUE_JWT_ADMIN_ROLES=service_role
  - GOTRUE_JWT_AUD=authenticated
  - GOTRUE_JWT_DEFAULT_GROUP_NAME=authenticated
  - GOTRUE_JWT_EXP=3600
  - GOTRUE_JWT_SECRET=${JWT_SECRET}
  - GOTRUE_EXTERNAL_EMAIL_ENABLED=true
  - GOTRUE_MAILER_AUTOCONFIRM=true
  - GOTRUE_SMTP_ADMIN_EMAIL=admin@localhost
  - GOTRUE_MAILER_URLPATHS_INVITE=/auth/v1/verify
  - GOTRUE_MAILER_URLPATHS_CONFIRMATION=/auth/v1/verify
  - GOTRUE_MAILER_URLPATHS_RECOVERY=/auth/v1/verify
  - GOTRUE_MAILER_URLPATHS_EMAIL_CHANGE=/auth/v1/verify
  Depends on db. Health check: wget --no-verbose --tries=1 --spider http://localhost:9999/health

- **rest** (postgrest/postgrest:v12.2.3): PostgREST for auto-generated REST API. Expose 3000 internally. Environment:
  - PGRST_DB_URI=postgres://authenticator:${POSTGRES_PASSWORD}@db:5432/postgres
  - PGRST_DB_SCHEMAS=public,storage,graphql_public
  - PGRST_DB_ANON_ROLE=anon
  - PGRST_JWT_SECRET=${JWT_SECRET}
  - PGRST_DB_USE_LEGACY_GUCS=false
  - PGRST_APP_SETTINGS_JWT_SECRET=${JWT_SECRET}
  - PGRST_APP_SETTINGS_JWT_EXP=3600
  Depends on db.

- **studio** (supabase/studio:20241202-4c1a189): Dashboard UI. Expose ${STUDIO_PORT}:3000. Environment:
  - STUDIO_DEFAULT_ORGANIZATION=Throughput OS
  - STUDIO_DEFAULT_PROJECT=Default
  - SUPABASE_PUBLIC_URL=${SUPABASE_PUBLIC_URL}
  - SUPABASE_URL=http://kong:8000
  - SUPABASE_REST_URL=${API_EXTERNAL_URL}/rest/v1/
  - SUPABASE_ANON_KEY=${ANON_KEY}
  - SUPABASE_SERVICE_KEY=${SERVICE_ROLE_KEY}
  - AUTH_JWT_SECRET=${JWT_SECRET}
  - POSTGRES_PASSWORD=${POSTGRES_PASSWORD}
  - LOGFLARE_API_KEY=dummy
  - LOGFLARE_URL=http://localhost
  - NEXT_PUBLIC_ENABLE_LOGS=false
  - NEXT_ANALYTICS_BACKEND_PROVIDER=postgres

8. Create `supabase/volumes/kong/kong.yml` — the declarative Kong configuration that routes:
  - `/auth/v1/` → auth:9999
  - `/rest/v1/` → rest:3000
  - Add CORS plugin globally with `origins: ['*']`, `methods: [GET, POST, PUT, PATCH, DELETE, OPTIONS]`, `headers: [Accept, Authorization, Content-Type, apikey, x-client-info]`, `credentials: true`
  - Add key-auth plugin for service_role routes
  - Add the anon and service_role consumers with their API keys

9. Create `supabase/volumes/db/init/00-schema.sql`:
This must set up the required PostgreSQL roles and extensions that Supabase needs:
```sql
-- Create roles
CREATE ROLE anon NOLOGIN;
CREATE ROLE authenticated NOLOGIN;
CREATE ROLE service_role NOLOGIN BYPASSRLS;
CREATE ROLE authenticator NOINHERIT LOGIN PASSWORD 'POSTGRES_PASSWORD_PLACEHOLDER';
CREATE ROLE supabase_auth_admin NOINHERIT CREATEROLE LOGIN PASSWORD 'POSTGRES_PASSWORD_PLACEHOLDER';
CREATE ROLE supabase_storage_admin NOINHERIT CREATEROLE LOGIN PASSWORD 'POSTGRES_PASSWORD_PLACEHOLDER';

-- Grant roles
GRANT anon TO authenticator;
GRANT authenticated TO authenticator;
GRANT service_role TO authenticator;
GRANT supabase_auth_admin TO postgres;
GRANT supabase_storage_admin TO postgres;

-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp" SCHEMA public;
CREATE EXTENSION IF NOT EXISTS pgcrypto SCHEMA public;
CREATE EXTENSION IF NOT EXISTS pgjwt SCHEMA public;

-- Auth schema (GoTrue needs this)
CREATE SCHEMA IF NOT EXISTS auth AUTHORIZATION supabase_auth_admin;
CREATE SCHEMA IF NOT EXISTS storage AUTHORIZATION supabase_storage_admin;

-- Grant usage
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT USAGE ON SCHEMA auth TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON FUNCTIONS TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO anon, authenticated, service_role;
```
Replace POSTGRES_PASSWORD_PLACEHOLDER with the value from .env.

10. Create `supabase/volumes/db/init/01-auth-schema.sql`:
This creates the Throughput OS application schema:

```sql
-- Private helper schema
CREATE SCHEMA IF NOT EXISTS private;

-- Enums
CREATE TYPE public.organization_role AS ENUM ('owner', 'admin', 'member', 'viewer');
CREATE TYPE public.product_status AS ENUM ('active', 'draft', 'archived', 'out_of_stock');
CREATE TYPE public.constraint_type AS ENUM ('marketing_budget', 'inventory_capital', 'fulfillment_capacity', 'production_capacity');
CREATE TYPE public.buffer_zone AS ENUM ('green', 'yellow', 'red');
CREATE TYPE public.import_status AS ENUM ('pending', 'processing', 'completed', 'failed');
CREATE TYPE public.channel_type AS ENUM ('dtc_website', 'amazon', 'wholesale_spa', 'email', 'seo', 'meta_ads', 'google_ads', 'tiktok', 'affiliate', 'referral', 'other');

-- Auto-update trigger
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Helper functions (SECURITY DEFINER for RLS performance)
CREATE OR REPLACE FUNCTION private.get_user_org_ids()
RETURNS SETOF uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT organization_id FROM public.organization_members WHERE user_id = auth.uid()
$$;

CREATE OR REPLACE FUNCTION private.is_org_member(org_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.organization_members
    WHERE user_id = auth.uid() AND organization_id = org_id
  )
$$;

CREATE OR REPLACE FUNCTION private.is_org_admin(org_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.organization_members
    WHERE user_id = auth.uid() AND organization_id = org_id AND role IN ('owner', 'admin')
  )
$$;

-- Core tables

CREATE TABLE public.organizations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  settings jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
CREATE TRIGGER trg_organizations_updated BEFORE UPDATE ON public.organizations FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TABLE public.organization_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  role organization_role DEFAULT 'member',
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, organization_id)
);
CREATE INDEX idx_orgmembers_user ON public.organization_members(user_id);
CREATE INDEX idx_orgmembers_org ON public.organization_members(organization_id);

CREATE TABLE public.products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  external_id text,
  name text NOT NULL,
  handle text,
  category text,
  subcategory text,
  status product_status DEFAULT 'active',
  image_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
CREATE TRIGGER trg_products_updated BEFORE UPDATE ON public.products FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE INDEX idx_products_org ON public.products(organization_id);

CREATE TABLE public.product_variants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  external_id text,
  sku text,
  name text NOT NULL,
  price numeric(10,2) NOT NULL DEFAULT 0,
  compare_at_price numeric(10,2),
  cogs numeric(10,2) DEFAULT 0,
  shipping_cost numeric(10,2) DEFAULT 0,
  payment_processing_pct numeric(5,4) DEFAULT 0.029,
  payment_processing_fixed numeric(10,2) DEFAULT 0.30,
  weight_grams numeric(10,2),
  inventory_quantity integer DEFAULT 0,
  requires_shipping boolean DEFAULT true,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
CREATE TRIGGER trg_variants_updated BEFORE UPDATE ON public.product_variants FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE INDEX idx_variants_org ON public.product_variants(organization_id);
CREATE INDEX idx_variants_product ON public.product_variants(product_id);

CREATE TABLE public.orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  external_id text,
  order_number text,
  customer_email text,
  channel channel_type DEFAULT 'dtc_website',
  subtotal numeric(12,2) DEFAULT 0,
  shipping_total numeric(12,2) DEFAULT 0,
  discount_total numeric(12,2) DEFAULT 0,
  tax_total numeric(12,2) DEFAULT 0,
  total numeric(12,2) DEFAULT 0,
  financial_status text DEFAULT 'paid',
  fulfillment_status text,
  order_date timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz DEFAULT now()
);
CREATE INDEX idx_orders_org ON public.orders(organization_id);
CREATE INDEX idx_orders_date ON public.orders(organization_id, order_date);

CREATE TABLE public.order_line_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  product_variant_id uuid REFERENCES public.product_variants(id) ON DELETE SET NULL,
  product_name text,
  variant_name text,
  sku text,
  quantity integer NOT NULL DEFAULT 1,
  unit_price numeric(10,2) NOT NULL DEFAULT 0,
  total_price numeric(12,2) NOT NULL DEFAULT 0,
  total_discount numeric(10,2) DEFAULT 0,
  created_at timestamptz DEFAULT now()
);
CREATE INDEX idx_lineitems_org ON public.order_line_items(organization_id);
CREATE INDEX idx_lineitems_order ON public.order_line_items(order_id);
CREATE INDEX idx_lineitems_variant ON public.order_line_items(product_variant_id);

CREATE TABLE public.constraints (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  type constraint_type NOT NULL,
  name text NOT NULL,
  capacity numeric(14,2) NOT NULL,
  capacity_unit text DEFAULT 'dollars',
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
CREATE TRIGGER trg_constraints_updated BEFORE UPDATE ON public.constraints FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE INDEX idx_constraints_org ON public.constraints(organization_id);

CREATE TABLE public.marketing_spend (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  channel channel_type NOT NULL,
  period_start date NOT NULL,
  period_end date NOT NULL,
  spend numeric(12,2) NOT NULL DEFAULT 0,
  impressions integer,
  clicks integer,
  conversions integer,
  revenue_attributed numeric(12,2) DEFAULT 0,
  created_at timestamptz DEFAULT now()
);
CREATE INDEX idx_mktgspend_org ON public.marketing_spend(organization_id);

CREATE TABLE public.buffer_targets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  product_variant_id uuid NOT NULL REFERENCES public.product_variants(id) ON DELETE CASCADE,
  buffer_quantity integer NOT NULL DEFAULT 0,
  green_zone_qty integer NOT NULL DEFAULT 0,
  yellow_zone_qty integer NOT NULL DEFAULT 0,
  red_zone_qty integer NOT NULL DEFAULT 0,
  current_zone buffer_zone DEFAULT 'green',
  avg_daily_usage numeric(10,2) DEFAULT 0,
  lead_time_days integer DEFAULT 14,
  shelf_life_days integer,
  last_adjustment_date timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
CREATE TRIGGER trg_buffers_updated BEFORE UPDATE ON public.buffer_targets FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE INDEX idx_buffers_org ON public.buffer_targets(organization_id);
CREATE INDEX idx_buffers_variant ON public.buffer_targets(product_variant_id);

CREATE TABLE public.toc_snapshots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  snapshot_date date NOT NULL DEFAULT CURRENT_DATE,
  total_throughput numeric(14,2),
  total_inventory numeric(14,2),
  total_operating_expense numeric(14,2),
  net_profit numeric(14,2),
  roi numeric(10,4),
  productivity numeric(10,4),
  constraint_id uuid REFERENCES public.constraints(id),
  details jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);
CREATE INDEX idx_snapshots_org ON public.toc_snapshots(organization_id, snapshot_date);

CREATE TABLE public.csv_imports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  entity_type text NOT NULL,
  status import_status DEFAULT 'pending',
  file_name text,
  row_count integer DEFAULT 0,
  success_count integer DEFAULT 0,
  error_count integer DEFAULT 0,
  field_mapping jsonb DEFAULT '{}',
  error_details jsonb DEFAULT '[]',
  created_by uuid NOT NULL REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now()
);
CREATE INDEX idx_imports_org ON public.csv_imports(organization_id);

CREATE TABLE public.simulations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  parameters jsonb NOT NULL DEFAULT '{}',
  results jsonb DEFAULT '{}',
  created_by uuid NOT NULL REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now()
);
CREATE INDEX idx_simulations_org ON public.simulations(organization_id);

-- Enable RLS on ALL tables
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_line_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.constraints ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marketing_spend ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.buffer_targets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.toc_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.csv_imports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.simulations ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Organizations
CREATE POLICY "org_select" ON public.organizations FOR SELECT TO authenticated
  USING (id IN (SELECT private.get_user_org_ids()));
CREATE POLICY "org_insert" ON public.organizations FOR INSERT TO authenticated
  WITH CHECK (true);
CREATE POLICY "org_update" ON public.organizations FOR UPDATE TO authenticated
  USING ((SELECT private.is_org_admin(id)));
CREATE POLICY "org_delete" ON public.organizations FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.organization_members WHERE organization_id = id AND user_id = auth.uid() AND role = 'owner'));

-- Organization members
CREATE POLICY "orgmem_select" ON public.organization_members FOR SELECT TO authenticated
  USING (organization_id IN (SELECT private.get_user_org_ids()));
CREATE POLICY "orgmem_insert" ON public.organization_members FOR INSERT TO authenticated
  WITH CHECK ((SELECT private.is_org_admin(organization_id)) OR user_id = auth.uid());
CREATE POLICY "orgmem_update" ON public.organization_members FOR UPDATE TO authenticated
  USING ((SELECT private.is_org_admin(organization_id)));
CREATE POLICY "orgmem_delete" ON public.organization_members FOR DELETE TO authenticated
  USING ((SELECT private.is_org_admin(organization_id)));

-- Tenant-scoped tables (products, variants, orders, line_items, constraints, marketing_spend, buffers, snapshots, imports, simulations)
-- All use the same pattern: SELECT/INSERT/UPDATE for org members, DELETE for admins
DO $$
DECLARE
  tbl text;
BEGIN
  FOR tbl IN SELECT unnest(ARRAY[
    'products', 'product_variants', 'orders', 'order_line_items',
    'constraints', 'marketing_spend', 'buffer_targets', 'toc_snapshots',
    'csv_imports', 'simulations'
  ]) LOOP
    EXECUTE format('CREATE POLICY "%s_select" ON public.%I FOR SELECT TO authenticated USING (organization_id IN (SELECT private.get_user_org_ids()))', tbl, tbl);
    EXECUTE format('CREATE POLICY "%s_insert" ON public.%I FOR INSERT TO authenticated WITH CHECK (organization_id IN (SELECT private.get_user_org_ids()))', tbl, tbl);
    EXECUTE format('CREATE POLICY "%s_update" ON public.%I FOR UPDATE TO authenticated USING (organization_id IN (SELECT private.get_user_org_ids()))', tbl, tbl);
    EXECUTE format('CREATE POLICY "%s_delete" ON public.%I FOR DELETE TO authenticated USING ((SELECT private.is_org_admin(organization_id)))', tbl, tbl);
  END LOOP;
END;
$$;

-- Throughput calculation view
CREATE OR REPLACE VIEW public.v_product_throughput AS
SELECT
  pv.id AS variant_id,
  pv.organization_id,
  p.id AS product_id,
  p.name AS product_name,
  p.category,
  pv.name AS variant_name,
  pv.sku,
  pv.price,
  pv.cogs,
  pv.shipping_cost,
  (pv.price * pv.payment_processing_pct + pv.payment_processing_fixed) AS processing_cost,
  (pv.cogs + pv.shipping_cost + (pv.price * pv.payment_processing_pct + pv.payment_processing_fixed)) AS total_tvc,
  (pv.price - (pv.cogs + pv.shipping_cost + (pv.price * pv.payment_processing_pct + pv.payment_processing_fixed))) AS throughput_per_unit,
  CASE WHEN pv.price > 0
    THEN ROUND(((pv.price - (pv.cogs + pv.shipping_cost + (pv.price * pv.payment_processing_pct + pv.payment_processing_fixed))) / pv.price * 100)::numeric, 1)
    ELSE 0
  END AS throughput_margin_pct,
  pv.inventory_quantity,
  (pv.inventory_quantity * pv.cogs) AS inventory_investment,
  p.image_url,
  p.status
FROM public.product_variants pv
JOIN public.products p ON p.id = pv.product_id
WHERE pv.is_active = true;
```

11. Create `supabase/volumes/db/init/02-seed.sql` with sample Shankara beauty products data:

Insert a demo organization called "Shankara Naturals" with slug "shankara-naturals".

Insert these products and variants (realistic Shankara catalog):

Products (category, name, prices, estimated COGS at ~30-35%):
- Face Care / Kumkumadi Tailam (Miraculous Beauty Fluid) - $50, COGS $12, shipping $6
- Face Care / Rich Repair Treatment Serum - $52, COGS $14, shipping $6
- Face Care / Timeless Restorative Skin Elixir - $90, COGS $22, shipping $6
- Face Care / Nourishing Facial Oil Fine Line - $68, COGS $17, shipping $6
- Face Care / Sun Protect SPF 30 - $50, COGS $11, shipping $5
- Face Care / Energizing Essence - $60, COGS $15, shipping $6
- Face Care / Anti-Age Moisturizer (Calming) - $70, COGS $18, shipping $6
- Face Care / Hydrating Cleanser - $36, COGS $8, shipping $5
- Face Care / Deep Cleanse Gel - $22, COGS $5, shipping $4
- Body Care / Muscle Release Oil - $62, COGS $16, shipping $6
- Body Care / Calming Body Oil - $52, COGS $13, shipping $6
- Body Care / Energizing Body Wash - $38, COGS $9, shipping $5
- Body Care / Sundarya Body Oil - $22, COGS $5, shipping $5
- Body Care / Naturalé Deodorant - $16, COGS $4, shipping $4
- Sets / Timeless Essentials Bundle - $155, COGS $38, shipping $8
- Sets / Gheesutra Skincare Collection - $191, COGS $48, shipping $9

Generate 200+ orders spread over the last 6 months with realistic distribution (bestsellers get more orders). Mix of channels: 60% dtc_website, 15% amazon, 15% wholesale_spa, 10% other.

Insert a constraint: marketing_budget, $15,000/month capacity.
Insert marketing_spend data for last 3 months across dtc_website, email, meta_ads, google_ads, seo, affiliate channels.

12. Start the Supabase stack:
```bash
cd supabase
docker compose up -d
```

Wait for all containers to be healthy (check with `docker compose ps`). The studio should be accessible at http://localhost:3001.

Verify the database has the schema:
```bash
docker compose exec db psql -U supabase_admin -d postgres -c "\dt public.*"
```

## PHASE 3: Next.js 15 frontend

13. Initialize the Next.js project:
```bash
cd ~/throughput-os
npx create-next-app@latest frontend --ts --tailwind --eslint --app --src-dir --import-alias "@/*" --yes
cd frontend
```

14. Install all dependencies:
```bash
npm install @supabase/supabase-js @supabase/ssr next-themes zod papaparse react-dropzone lucide-react recharts
npm install -D @types/papaparse
```

15. Initialize shadcn/ui:
```bash
npx shadcn@latest init --defaults --force
npx shadcn@latest add button card table input select sheet dialog tabs dropdown-menu avatar badge separator scroll-area command sonner label textarea skeleton tooltip progress switch chart
```

16. Create `frontend/.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL=http://localhost:8000
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0
NEXT_PUBLIC_API_URL=http://localhost:8080
```

17. Create the Supabase client files:

`src/lib/supabase/client.ts` — browser client using createBrowserClient from @supabase/ssr

`src/lib/supabase/server.ts` — server client using createServerClient with cookies(). Use the getAll/setAll cookie pattern (NEVER the deprecated get/set/remove). Since this is Next.js 15, `cookies()` must be awaited.

`src/lib/supabase/middleware.ts` — updateSession function that refreshes auth tokens and redirects unauthenticated users away from protected routes. Allow: /login, /signup, /auth/*, /

18. Create `src/middleware.ts` (NOT in src/app/) that calls updateSession. Standard matcher excluding _next/static, _next/image, favicon.ico.

19. Create the auth flow:
- `app/(auth)/login/page.tsx` — server component, redirects to /dashboard if logged in
- `app/(auth)/login/actions.ts` — server actions for login and signup using supabase.auth.signInWithPassword and supabase.auth.signUp
- `components/auth/login-form.tsx` — client component with email/password form using shadcn Card, Input, Button, Label
- `app/(auth)/signup/page.tsx` + `components/auth/signup-form.tsx` — registration form
- `app/auth/callback/route.ts` — OAuth callback, exchanges code for session, creates org if needed

20. Create the dashboard shell:
- `app/(dashboard)/layout.tsx` — server component, checks auth, renders sidebar + header + main content
- `components/layout/sidebar.tsx` — responsive sidebar with navigation items:
  * Dashboard (LayoutDashboard icon) → /dashboard
  * Products (Package icon) → /dashboard/products
  * Orders (ShoppingCart icon) → /dashboard/orders
  * Channels (Megaphone icon) → /dashboard/channels
  * Buffers (BarChart3 icon) → /dashboard/buffers
  * Simulate (FlaskConical icon) → /dashboard/simulate
  * Import (Upload icon) → /dashboard/import
  * Settings (Settings icon) → /dashboard/settings
- `components/layout/header.tsx` — top bar with mobile menu trigger, page title, theme toggle, user menu
- Active nav highlighting based on pathname

21. Create the dashboard home page `app/(dashboard)/page.tsx`:
- 4 KPI cards: Total Throughput, Inventory Investment, Operating Expense, Net Profit
- Fetch real data from Supabase (use the v_product_throughput view)
- A bar chart showing top 10 products by throughput per unit using Recharts
- A recent orders summary

22. Create placeholder pages for each nav item (server components with title + description).

23. Update `next.config.ts` with rewrites to proxy /api/v1/* to the FastAPI backend:
```typescript
async rewrites() {
  return [
    {
      source: "/api/v1/:path*",
      destination: `${process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8080"}/api/v1/:path*`,
    },
  ];
}
```

24. Verify the frontend builds and runs:
```bash
npm run build
npm run dev
```

## PHASE 4: FastAPI backend

25. Set up the Python project:
```bash
cd ~/throughput-os
mkdir -p backend/app/routers backend/app/schemas backend/app/services backend/tests
cd backend
```

26. Create `backend/pyproject.toml`:
```toml
[project]
name = "throughput-os-api"
version = "0.1.0"
requires-python = ">=3.12"
dependencies = [
    "fastapi[standard]>=0.115.0",
    "supabase>=2.0.0",
    "pydantic-settings>=2.0.0",
    "python-dotenv>=1.0.0",
    "python-multipart>=0.0.9",
    "python-jose[cryptography]>=3.3.0",
    "numpy>=2.0.0",
]

[dependency-groups]
dev = [
    "pytest>=8.0.0",
    "httpx>=0.27.0",
    "ruff>=0.8.0",
    "pytest-asyncio>=0.24.0",
]
```

Run `uv sync` to install dependencies.

27. Create `backend/.env`:
```env
SUPABASE_URL=http://localhost:8000
SUPABASE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0
SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU
JWT_SECRET=your-super-secret-jwt-token-with-at-least-32-characters-long
FRONTEND_URL=http://localhost:3000
DATABASE_URL=postgresql://supabase_admin:your-super-secret-and-long-postgres-password@localhost:5432/postgres
ENVIRONMENT=development
```

28. Create the FastAPI application:

`app/config.py` — pydantic_settings BaseSettings loading from .env

`app/main.py` — FastAPI app with CORS (allow localhost:3000), include routers at /api/v1

`app/dependencies.py` — get_current_user dependency: extract Bearer token, verify JWT with python-jose HS256, return payload. Also get_db dependency returning async database connection.

`app/routers/health.py` — GET /healthz returning status and version

`app/schemas/toc.py` — Pydantic v2 models:
- ProductThroughput: variant_id, product_name, variant_name, price, cogs, shipping_cost, processing_cost, total_tvc, throughput_per_unit, throughput_margin_pct, inventory_quantity, inventory_investment
- ThroughputSummary: total_throughput, total_inventory, total_operating_expense, net_profit, roi, productivity, top_products (list), constraint_info
- WhatIfScenario: scenario_name, parameter_changes (dict), projected_throughput_delta, projected_net_profit

`app/services/toc_engine.py` — TOCEngine class:
- calculate_throughput(price, cogs, shipping, processing_pct, processing_fixed) → throughput per unit
- rank_by_tcu(products, constraint_type, constraint_capacity) → sorted list by T/CU
- calculate_buffer(avg_daily_usage, lead_time_days, variability_factor=1.5) → buffer_qty and zone thresholds
- run_what_if(base_data, scenario_params) → projected outcomes
- calculate_channel_tcu(channel_spend, channel_throughput) → T/CU per channel

`app/routers/calculations.py`:
- GET /throughput-summary → fetches products + orders from Supabase, computes system-wide T, I, OE, NP
- GET /product-rankings?constraint_type=marketing_budget → returns products ranked by T/CU
- POST /what-if → runs scenario simulation and returns projected outcomes
- GET /buffer-status → returns buffer zone status for all variants

`app/routers/products.py`:
- GET /products → list products with throughput data
- POST /products/import-shopify → accept Shopify products.json data and import

29. Create a basic test:
```python
# tests/test_toc_engine.py
from app.services.toc_engine import TOCEngine

def test_throughput_calculation():
    engine = TOCEngine()
    t = engine.calculate_throughput(price=50, cogs=12, shipping=6, processing_pct=0.029, processing_fixed=0.30)
    expected_processing = 50 * 0.029 + 0.30  # 1.75
    expected_tvc = 12 + 6 + 1.75  # 19.75
    expected_throughput = 50 - 19.75  # 30.25
    assert abs(t - expected_throughput) < 0.01

def test_tcu_ranking():
    engine = TOCEngine()
    products = [
        {"name": "Moisturizer", "throughput": 52, "constraint_units": 15},
        {"name": "Kumkumadi Oil", "throughput": 32, "constraint_units": 18},
        {"name": "Gheesutra Emulsion", "throughput": 68, "constraint_units": 55},
    ]
    ranked = engine.rank_by_tcu(products, constraint_capacity=15000)
    assert ranked[0]["name"] == "Moisturizer"  # Highest T/CU
```

30. Verify the backend starts:
```bash
cd ~/throughput-os/backend
uv run fastapi dev app/main.py --port 8080
```

Run tests:
```bash
uv run pytest
```

## PHASE 5: Create CLAUDE.md

31. Create `~/throughput-os/CLAUDE.md`:

```markdown
# Throughput OS

Beauty e-commerce profitability platform applying Theory of Constraints / Throughput Accounting.
Target customer: Shankara Naturals (premium Ayurvedic skincare, ~$3M revenue, 48+ SKUs on Shopify).

## Tech Stack
- Frontend: Next.js 15 (App Router), TypeScript, Tailwind CSS 4, shadcn/ui, Recharts
- Backend: Python 3.12, FastAPI, Pydantic v2, uv
- Database: Supabase (PostgreSQL) running locally via Docker Compose
- Auth: Supabase GoTrue (email auth, MAILER_AUTOCONFIRM=true for dev)

## Local Services
- Frontend: http://localhost:3000 (Next.js dev)
- API Gateway (Kong): http://localhost:8000 (Supabase API + Auth)
- FastAPI Backend: http://localhost:8080
- Supabase Studio: http://localhost:3001
- PostgreSQL: localhost:5432 (user: supabase_admin)

## Commands
### Frontend (from frontend/)
npm run dev          # localhost:3000
npm run build        # production build

### Backend (from backend/)
uv run fastapi dev app/main.py --port 8080   # dev with reload
uv run pytest                                 # tests

### Database
docker compose -f supabase/docker-compose.yml up -d    # start
docker compose -f supabase/docker-compose.yml down      # stop
docker compose -f supabase/docker-compose.yml logs -f   # logs

## TOC Formulas
- Throughput (T) = Revenue - TVC (COGS + shipping + payment processing)
- T/CU = Throughput per unit / Constraint units consumed
- Net Profit = Total T - Operating Expense
- ROI = (T - OE) / I
- Buffer = ADU × Lead Time × Variability Factor
```

## PHASE 6: Create startup script

32. Create `~/throughput-os/start-dev.sh`:
```bash
#!/bin/bash
echo "Starting Throughput OS development environment..."

# Start Supabase
echo "Starting Supabase..."
cd supabase && docker compose up -d && cd ..

# Wait for DB
echo "Waiting for database..."
until docker compose -f supabase/docker-compose.yml exec -T db pg_isready -U supabase_admin 2>/dev/null; do
  sleep 2
done
echo "Database ready!"

# Start backend
echo "Starting FastAPI backend..."
cd backend && uv run fastapi dev app/main.py --port 8080 &
BACKEND_PID=$!
cd ..

# Start frontend
echo "Starting Next.js frontend..."
cd frontend && npm run dev &
FRONTEND_PID=$!
cd ..

echo ""
echo "=== Throughput OS is running ==="
echo "Frontend:       http://localhost:3000"
echo "FastAPI:        http://localhost:8080"
echo "Supabase API:   http://localhost:8000"
echo "Supabase Studio: http://localhost:3001"
echo ""
echo "Press Ctrl+C to stop all services"

trap "kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; cd supabase && docker compose down; exit" SIGINT SIGTERM
wait
```

Make it executable: `chmod +x start-dev.sh`

## PHASE 7: Verify everything works

33. Run through this verification checklist:

a. Start all services: `./start-dev.sh`
b. Open http://localhost:3001 — Supabase Studio should load, show the database tables
c. Open http://localhost:8080/healthz — should return {"status": "ok"}
d. Open http://localhost:3000 — should show login page
e. Sign up with test@example.com / password123 — should create account and redirect
f. Dashboard should display with KPI cards (data from seed)
g. Navigate through all sidebar items — each page should load without errors
h. Run `npm run build` in frontend/ — should succeed with zero errors
i. Run `uv run pytest` in backend/ — should pass all tests

Fix any issues found during verification before committing.

34. Git init and commit:
```bash
cd ~/throughput-os
git init
git add -A
git commit -m "feat: initialize Throughput OS with Next.js, FastAPI, and local Supabase"
```

---END---

## Troubleshooting notes

**If Docker containers fail to start:** Check `docker compose logs` for specific errors. The most common issue is port conflicts — make sure nothing else is running on ports 3000, 3001, 5432, 8000, or 8080.

**If auth doesn't work:** The GoTrue container needs to be healthy before the frontend can authenticate. Check `docker compose ps` and wait for all containers to show "healthy". With `GOTRUE_MAILER_AUTOCONFIRM=true`, email verification is bypassed in development.

**If RLS blocks all queries:** Ensure the user has an organization_members row. The auth callback and signup flow must create both the organization and the membership record.

**If the Next.js proxy doesn't reach FastAPI:** Verify the FastAPI backend is running on port 8080 (not 8000, which Kong uses). Check that `next.config.ts` rewrites point to `http://127.0.0.1:8080`.

**To reset the database completely:**
```bash
cd supabase
docker compose down -v   # -v removes volumes
docker compose up -d     # recreates with fresh init scripts
```
