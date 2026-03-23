-- Migration 18: AI Insights table
-- Run in Supabase Studio or via migration tool

CREATE TABLE IF NOT EXISTS public.ai_insights (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id),
  type text NOT NULL CHECK (type IN ('weekly', 'product', 'ask')),
  content jsonb NOT NULL,
  prompt_tokens int,
  completion_tokens int,
  generated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.ai_insights ENABLE ROW LEVEL SECURITY;
CREATE POLICY "org_members_read_own_insights" ON public.ai_insights
  FOR SELECT USING (organization_id = (
    SELECT organization_id FROM public.organization_members
    WHERE user_id = auth.uid() LIMIT 1
  ));

-- Migration 19: Onboarding progress
CREATE TABLE IF NOT EXISTS public.onboarding_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) UNIQUE,
  step text NOT NULL DEFAULT 'signup',
  completed_steps text[] NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.onboarding_progress ENABLE ROW LEVEL SECURITY;
CREATE POLICY "org_members_manage_onboarding" ON public.onboarding_progress
  FOR ALL USING (organization_id = (
    SELECT organization_id FROM public.organization_members
    WHERE user_id = auth.uid() LIMIT 1
  ));

-- Migration 20: White-label configuration
CREATE TABLE IF NOT EXISTS public.whitelabel_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) UNIQUE,
  brand_name text NOT NULL DEFAULT 'Throughput OS',
  logo_url text,
  primary_color text DEFAULT '#8B5E3C',
  secondary_color text DEFAULT '#F5F0E8',
  custom_domain text,
  favicon_url text,
  support_email text,
  hide_powered_by boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.whitelabel_config ENABLE ROW LEVEL SECURITY;
CREATE POLICY "org_admins_manage_whitelabel" ON public.whitelabel_config
  FOR ALL USING (organization_id = (
    SELECT organization_id FROM public.organization_members
    WHERE user_id = auth.uid() AND role IN ('owner', 'admin') LIMIT 1
  ));

-- Migration 21: Changelog entries
CREATE TABLE IF NOT EXISTS public.changelog_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  version text NOT NULL,
  title text NOT NULL,
  summary text NOT NULL,
  content text NOT NULL,
  category text NOT NULL DEFAULT 'feature'
    CHECK (category IN ('feature', 'fix', 'improvement', 'breaking')),
  published_at timestamptz NOT NULL DEFAULT now(),
  is_published boolean NOT NULL DEFAULT false
);
-- No RLS: changelog is public
CREATE INDEX idx_changelog_published ON public.changelog_entries(published_at DESC)
  WHERE is_published = true;

-- Migration 22: Anomalies
CREATE TABLE IF NOT EXISTS public.anomalies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id),
  rule_id text NOT NULL,
  severity text NOT NULL CHECK (severity IN ('info', 'warning', 'critical')),
  message text NOT NULL,
  entity_type text CHECK (entity_type IN ('product', 'buffer', 'system')),
  entity_id uuid,
  resolved_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.anomalies ENABLE ROW LEVEL SECURITY;
CREATE POLICY "org_members_read_own_anomalies" ON public.anomalies
  FOR SELECT USING (organization_id = (
    SELECT organization_id FROM public.organization_members
    WHERE user_id = auth.uid() LIMIT 1
  ));
CREATE POLICY "service_role_insert_anomalies" ON public.anomalies
  FOR INSERT WITH CHECK (true);  -- backend service key can insert
CREATE INDEX idx_anomalies_unresolved
  ON public.anomalies(organization_id, created_at DESC)
  WHERE resolved_at IS NULL;

-- Migration 23: Production resources
CREATE TABLE IF NOT EXISTS public.production_resources (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id),
  name text NOT NULL,
  capacity_per_week numeric NOT NULL CHECK (capacity_per_week > 0),
  capacity_unit text NOT NULL DEFAULT 'minutes',
  current_load numeric,
  is_constraint boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.product_resource_requirements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_variant_id uuid NOT NULL REFERENCES public.product_variants(id),
  resource_id uuid NOT NULL REFERENCES public.production_resources(id),
  minutes_required numeric NOT NULL CHECK (minutes_required > 0),
  UNIQUE(product_variant_id, resource_id)
);
ALTER TABLE public.production_resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_resource_requirements ENABLE ROW LEVEL SECURITY;

-- Migration 24: Learning modules
CREATE TABLE IF NOT EXISTS public.learning_modules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  title text NOT NULL,
  description text NOT NULL,
  duration_minutes int NOT NULL CHECK (duration_minutes > 0),
  order_index int NOT NULL,
  content_type text NOT NULL DEFAULT 'article'
    CHECK (content_type IN ('article', 'video', 'interactive')),
  content jsonb NOT NULL,
  is_published boolean NOT NULL DEFAULT true
);
CREATE TABLE IF NOT EXISTS public.learning_progress (
  user_id uuid NOT NULL REFERENCES auth.users(id),
  module_slug text NOT NULL,
  completed_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY(user_id, module_slug)
);
-- Learning modules are public; progress is per-user

-- Migration 25: Referrals
CREATE TABLE IF NOT EXISTS public.referrals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_org_id uuid NOT NULL REFERENCES public.organizations(id),
  referrer_user_id uuid NOT NULL REFERENCES auth.users(id),
  referral_code text NOT NULL UNIQUE DEFAULT upper(substring(gen_random_uuid()::text, 1, 8)),
  referee_email text,
  referee_org_id uuid REFERENCES public.organizations(id),
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'signed_up', 'converted')),
  reward_credited_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "org_members_read_own_referrals" ON public.referrals
  FOR SELECT USING (
    referrer_org_id = (
      SELECT organization_id FROM public.organization_members
      WHERE user_id = auth.uid() LIMIT 1
    )
    OR referee_org_id = (
      SELECT organization_id FROM public.organization_members
      WHERE user_id = auth.uid() LIMIT 1
    )
  );

-- Source columns for multi-marketplace support (Card 75)
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS source text DEFAULT 'shopify';
ALTER TABLE public.order_line_items ADD COLUMN IF NOT EXISTS source text DEFAULT 'shopify';
CREATE TABLE IF NOT EXISTS public.variable_cost_adjustments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES public.orders(id),
  source text NOT NULL,
  adjustment_type text NOT NULL,
  amount numeric NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Performance indexes (Card 80)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_order_line_items_product_variant_id
  ON public.order_line_items(product_variant_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_orders_organization_id_created_at
  ON public.orders(organization_id, created_at DESC);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_product_variants_organization_id
  ON public.product_variants(organization_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_toc_snapshots_org_captured
  ON public.toc_snapshots(organization_id, captured_at DESC);
