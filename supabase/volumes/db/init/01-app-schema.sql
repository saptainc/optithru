-- 01-app-schema.sql
-- Throughput OS application schema: enums, tables, RLS, views

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
CREATE POLICY "org_select" ON public.organizations FOR SELECT TO authenticated
  USING (id IN (SELECT private.get_user_org_ids()));
CREATE POLICY "org_insert" ON public.organizations FOR INSERT TO authenticated
  WITH CHECK (true);
CREATE POLICY "org_update" ON public.organizations FOR UPDATE TO authenticated
  USING ((SELECT private.is_org_admin(id)));
CREATE POLICY "org_delete" ON public.organizations FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.organization_members WHERE organization_id = id AND user_id = auth.uid() AND role = 'owner'));

CREATE POLICY "orgmem_select" ON public.organization_members FOR SELECT TO authenticated
  USING (organization_id IN (SELECT private.get_user_org_ids()));
CREATE POLICY "orgmem_insert" ON public.organization_members FOR INSERT TO authenticated
  WITH CHECK ((SELECT private.is_org_admin(organization_id)) OR user_id = auth.uid());
CREATE POLICY "orgmem_update" ON public.organization_members FOR UPDATE TO authenticated
  USING ((SELECT private.is_org_admin(organization_id)));
CREATE POLICY "orgmem_delete" ON public.organization_members FOR DELETE TO authenticated
  USING ((SELECT private.is_org_admin(organization_id)));

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
