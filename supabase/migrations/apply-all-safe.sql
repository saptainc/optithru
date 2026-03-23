-- ============================================================
-- SAFE IDEMPOTENT APPLY-ALL SCRIPT
-- Can be run multiple times without error
-- Paste this into Supabase Studio SQL Editor
-- ============================================================

-- ===================== WEEK 2: RPC FUNCTIONS =====================

-- 07: fn_product_throughput_summary + fn_system_kpis
CREATE OR REPLACE FUNCTION public.fn_product_throughput_summary(
  p_org_id uuid,
  p_start_date date DEFAULT (CURRENT_DATE - interval '180 days')::date,
  p_end_date date DEFAULT CURRENT_DATE
)
RETURNS TABLE (
  product_id uuid, product_name text, category text, image_url text,
  price numeric, cogs numeric, throughput_per_unit numeric, throughput_margin_pct numeric,
  total_units_sold bigint, total_revenue numeric, total_throughput numeric,
  inventory_quantity integer, inventory_investment numeric
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = ''
AS $$
  SELECT vpt.product_id, vpt.product_name, vpt.category, vpt.image_url,
    vpt.price, vpt.cogs, vpt.throughput_per_unit, vpt.throughput_margin_pct,
    COALESCE(agg.total_units, 0)::bigint AS total_units_sold,
    COALESCE(agg.total_rev, 0) AS total_revenue,
    COALESCE(agg.total_units * vpt.throughput_per_unit, 0) AS total_throughput,
    vpt.inventory_quantity, vpt.inventory_investment
  FROM public.v_product_throughput vpt
  LEFT JOIN (
    SELECT oli.product_variant_id, SUM(oli.quantity) AS total_units, SUM(oli.total_price) AS total_rev
    FROM public.order_line_items oli
    JOIN public.orders o ON o.id = oli.order_id
    WHERE o.organization_id = p_org_id AND o.order_date::date BETWEEN p_start_date AND p_end_date AND o.financial_status = 'paid'
    GROUP BY oli.product_variant_id
  ) agg ON agg.product_variant_id = vpt.variant_id
  WHERE vpt.organization_id = p_org_id
  ORDER BY total_throughput DESC NULLS LAST;
$$;

CREATE OR REPLACE FUNCTION public.fn_system_kpis(
  p_org_id uuid,
  p_start_date date DEFAULT (CURRENT_DATE - interval '180 days')::date,
  p_end_date date DEFAULT CURRENT_DATE
)
RETURNS TABLE (
  total_throughput numeric, total_inventory_investment numeric, total_operating_expense numeric,
  net_profit numeric, product_count bigint, order_count bigint, total_units_sold bigint, total_revenue numeric
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = ''
AS $$
  SELECT
    COALESCE((SELECT SUM(oli.quantity * vpt.throughput_per_unit) FROM public.order_line_items oli JOIN public.orders o ON o.id = oli.order_id JOIN public.v_product_throughput vpt ON vpt.variant_id = oli.product_variant_id WHERE o.organization_id = p_org_id AND o.order_date::date BETWEEN p_start_date AND p_end_date AND o.financial_status = 'paid'), 0),
    COALESCE((SELECT SUM(pv.inventory_quantity * pv.cogs) FROM public.product_variants pv WHERE pv.organization_id = p_org_id AND pv.is_active = true), 0),
    COALESCE((SELECT SUM(ms.spend) FROM public.marketing_spend ms WHERE ms.organization_id = p_org_id AND ms.period_start >= p_start_date AND ms.period_end <= p_end_date), 0),
    COALESCE((SELECT SUM(oli.quantity * vpt.throughput_per_unit) FROM public.order_line_items oli JOIN public.orders o ON o.id = oli.order_id JOIN public.v_product_throughput vpt ON vpt.variant_id = oli.product_variant_id WHERE o.organization_id = p_org_id AND o.order_date::date BETWEEN p_start_date AND p_end_date AND o.financial_status = 'paid'), 0)
    - COALESCE((SELECT SUM(ms.spend) FROM public.marketing_spend ms WHERE ms.organization_id = p_org_id AND ms.period_start >= p_start_date AND ms.period_end <= p_end_date), 0),
    (SELECT count(*) FROM public.product_variants WHERE organization_id = p_org_id AND is_active = true),
    (SELECT count(*) FROM public.orders WHERE organization_id = p_org_id AND order_date::date BETWEEN p_start_date AND p_end_date),
    COALESCE((SELECT SUM(oli.quantity) FROM public.order_line_items oli JOIN public.orders o ON o.id = oli.order_id WHERE o.organization_id = p_org_id AND o.order_date::date BETWEEN p_start_date AND p_end_date), 0),
    COALESCE((SELECT SUM(o.total) FROM public.orders o WHERE o.organization_id = p_org_id AND o.order_date::date BETWEEN p_start_date AND p_end_date), 0);
$$;

GRANT EXECUTE ON FUNCTION public.fn_product_throughput_summary TO authenticated;
GRANT EXECUTE ON FUNCTION public.fn_system_kpis TO authenticated;

-- 08: fn_tcu_rankings
CREATE OR REPLACE FUNCTION public.fn_tcu_rankings(p_org_id uuid, p_constraint_id uuid)
RETURNS TABLE (
  variant_id uuid, product_name text, category text, image_url text, price numeric,
  throughput_per_unit numeric, constraint_units_consumed numeric, tcu numeric,
  priority_rank bigint, total_units_sold bigint, total_throughput numeric
)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = ''
AS $$
DECLARE v_constraint_type text; v_constraint_capacity numeric;
BEGIN
  SELECT c.type, c.capacity INTO v_constraint_type, v_constraint_capacity
  FROM public.constraints c WHERE c.id = p_constraint_id AND c.organization_id = p_org_id;

  IF v_constraint_type = 'marketing_budget' THEN
    RETURN QUERY
    WITH product_sales AS (SELECT oli.product_variant_id, SUM(oli.quantity) AS units_sold, SUM(oli.total_price) AS revenue FROM public.order_line_items oli JOIN public.orders o ON o.id = oli.order_id WHERE o.organization_id = p_org_id AND o.order_date >= CURRENT_DATE - interval '180 days' GROUP BY oli.product_variant_id),
    total_revenue AS (SELECT COALESCE(SUM(revenue), 1) AS total_rev FROM product_sales),
    total_spend AS (SELECT COALESCE(SUM(spend), 1) AS total_sp FROM public.marketing_spend WHERE organization_id = p_org_id AND period_start >= CURRENT_DATE - interval '180 days')
    SELECT vpt.variant_id, vpt.product_name, vpt.category, vpt.image_url, vpt.price, vpt.throughput_per_unit,
      ROUND((COALESCE(ps.revenue, 0) / tr.total_rev * ts.total_sp)::numeric, 2),
      CASE WHEN COALESCE(ps.revenue, 0) = 0 THEN 0 ELSE ROUND((COALESCE(ps.units_sold, 0) * vpt.throughput_per_unit) / NULLIF(ps.revenue / tr.total_rev * ts.total_sp, 0), 2) END,
      ROW_NUMBER() OVER (ORDER BY CASE WHEN COALESCE(ps.revenue, 0) = 0 THEN 0 ELSE (COALESCE(ps.units_sold, 0) * vpt.throughput_per_unit) / NULLIF(ps.revenue / tr.total_rev * ts.total_sp, 0) END DESC NULLS LAST),
      COALESCE(ps.units_sold, 0)::bigint, ROUND(COALESCE(ps.units_sold, 0) * vpt.throughput_per_unit, 2)
    FROM public.v_product_throughput vpt LEFT JOIN product_sales ps ON ps.product_variant_id = vpt.variant_id CROSS JOIN total_revenue tr CROSS JOIN total_spend ts
    WHERE vpt.organization_id = p_org_id ORDER BY tcu DESC NULLS LAST;
  ELSIF v_constraint_type = 'inventory_capital' THEN
    RETURN QUERY
    WITH product_sales AS (SELECT oli.product_variant_id, SUM(oli.quantity) AS units_sold FROM public.order_line_items oli JOIN public.orders o ON o.id = oli.order_id WHERE o.organization_id = p_org_id AND o.order_date >= CURRENT_DATE - interval '180 days' GROUP BY oli.product_variant_id)
    SELECT vpt.variant_id, vpt.product_name, vpt.category, vpt.image_url, vpt.price, vpt.throughput_per_unit,
      vpt.inventory_investment,
      CASE WHEN vpt.inventory_investment <= 0 THEN 0 ELSE ROUND((COALESCE(ps.units_sold, 0) * vpt.throughput_per_unit) / vpt.inventory_investment, 2) END,
      ROW_NUMBER() OVER (ORDER BY CASE WHEN vpt.inventory_investment <= 0 THEN 0 ELSE (COALESCE(ps.units_sold, 0) * vpt.throughput_per_unit) / vpt.inventory_investment END DESC NULLS LAST),
      COALESCE(ps.units_sold, 0)::bigint, ROUND(COALESCE(ps.units_sold, 0) * vpt.throughput_per_unit, 2)
    FROM public.v_product_throughput vpt LEFT JOIN product_sales ps ON ps.product_variant_id = vpt.variant_id
    WHERE vpt.organization_id = p_org_id ORDER BY tcu DESC NULLS LAST;
  ELSE
    RETURN QUERY
    SELECT vpt.variant_id, vpt.product_name, vpt.category, vpt.image_url, vpt.price, vpt.throughput_per_unit,
      1::numeric, vpt.throughput_per_unit, ROW_NUMBER() OVER (ORDER BY vpt.throughput_per_unit DESC),
      0::bigint, 0::numeric
    FROM public.v_product_throughput vpt WHERE vpt.organization_id = p_org_id ORDER BY tcu DESC;
  END IF;
END;
$$;
GRANT EXECUTE ON FUNCTION public.fn_tcu_rankings TO authenticated;

-- 09: fn_channel_tcu
CREATE OR REPLACE FUNCTION public.fn_channel_tcu(p_org_id uuid, p_start_date date DEFAULT (CURRENT_DATE - interval '90 days')::date, p_end_date date DEFAULT CURRENT_DATE)
RETURNS TABLE (channel text, total_spend numeric, total_revenue numeric, estimated_throughput numeric, tcu numeric, conversions bigint, cpa numeric, roas numeric)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = ''
AS $$
  WITH channel_data AS (
    SELECT ms.channel::text, SUM(ms.spend) AS total_spend, SUM(ms.revenue_attributed) AS total_revenue, SUM(ms.conversions) AS conversions
    FROM public.marketing_spend ms WHERE ms.organization_id = p_org_id AND ms.period_start >= p_start_date AND ms.period_end <= p_end_date GROUP BY ms.channel
  ), avg_margin AS (
    SELECT COALESCE(AVG(vpt.throughput_margin_pct) / 100.0, 0.55) AS margin_pct FROM public.v_product_throughput vpt WHERE vpt.organization_id = p_org_id
  )
  SELECT cd.channel, cd.total_spend, cd.total_revenue,
    ROUND((cd.total_revenue * am.margin_pct)::numeric, 2),
    CASE WHEN cd.total_spend > 0 THEN ROUND((cd.total_revenue * am.margin_pct / cd.total_spend)::numeric, 2) ELSE 0 END,
    cd.conversions,
    CASE WHEN cd.conversions > 0 THEN ROUND((cd.total_spend / cd.conversions)::numeric, 2) ELSE 0 END,
    CASE WHEN cd.total_spend > 0 THEN ROUND((cd.total_revenue / cd.total_spend)::numeric, 2) ELSE 0 END
  FROM channel_data cd CROSS JOIN avg_margin am ORDER BY tcu DESC;
$$;
GRANT EXECUTE ON FUNCTION public.fn_channel_tcu TO authenticated;

-- 10: fn_calculate_buffers
CREATE OR REPLACE FUNCTION public.fn_calculate_buffers(p_org_id uuid)
RETURNS TABLE (variant_id uuid, product_name text, category text, image_url text, inventory_quantity integer, avg_daily_usage numeric, lead_time_days integer, buffer_quantity integer, green_zone_qty integer, yellow_zone_qty integer, red_zone_qty integer, current_zone text)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = ''
AS $$
DECLARE r record; v_adu numeric; v_buffer integer; v_zone_size integer; v_lead_time integer; v_zone text;
BEGIN
  FOR r IN SELECT vpt.variant_id, vpt.product_name, vpt.category, vpt.image_url, vpt.inventory_quantity,
    COALESCE((SELECT SUM(oli.quantity)::numeric FROM public.order_line_items oli JOIN public.orders o ON o.id = oli.order_id WHERE oli.product_variant_id = vpt.variant_id AND o.organization_id = p_org_id AND o.order_date >= CURRENT_DATE - interval '90 days') / 90.0, 0.1) AS adu
    FROM public.v_product_throughput vpt WHERE vpt.organization_id = p_org_id
  LOOP
    v_adu := r.adu; v_lead_time := 14;
    v_buffer := GREATEST(CEIL(v_adu * v_lead_time * 1.5), 1);
    v_zone_size := v_buffer / 3;
    IF r.inventory_quantity <= v_zone_size THEN v_zone := 'red';
    ELSIF r.inventory_quantity <= v_zone_size * 2 THEN v_zone := 'yellow';
    ELSE v_zone := 'green'; END IF;
    INSERT INTO public.buffer_targets (organization_id, product_variant_id, buffer_quantity, green_zone_qty, yellow_zone_qty, red_zone_qty, current_zone, avg_daily_usage, lead_time_days, last_adjustment_date)
    VALUES (p_org_id, r.variant_id, v_buffer, v_buffer - (2 * v_zone_size), v_zone_size, v_zone_size, v_zone::public.buffer_zone, v_adu, v_lead_time, NOW())
    ON CONFLICT (organization_id, product_variant_id) DO UPDATE SET buffer_quantity = EXCLUDED.buffer_quantity, green_zone_qty = EXCLUDED.green_zone_qty, yellow_zone_qty = EXCLUDED.yellow_zone_qty, red_zone_qty = EXCLUDED.red_zone_qty, current_zone = EXCLUDED.current_zone, avg_daily_usage = EXCLUDED.avg_daily_usage, last_adjustment_date = EXCLUDED.last_adjustment_date;
    variant_id := r.variant_id; product_name := r.product_name; category := r.category; image_url := r.image_url; inventory_quantity := r.inventory_quantity; avg_daily_usage := ROUND(v_adu, 2); lead_time_days := v_lead_time; buffer_quantity := v_buffer; green_zone_qty := v_buffer - (2 * v_zone_size); yellow_zone_qty := v_zone_size; red_zone_qty := v_zone_size; current_zone := v_zone;
    RETURN NEXT;
  END LOOP;
END;
$$;
CREATE UNIQUE INDEX IF NOT EXISTS idx_buffers_org_variant ON public.buffer_targets(organization_id, product_variant_id);
GRANT EXECUTE ON FUNCTION public.fn_calculate_buffers TO authenticated;

-- 11: fn_dollar_days
CREATE OR REPLACE FUNCTION public.fn_dollar_days(p_org_id uuid, p_period_days integer DEFAULT 90)
RETURNS TABLE (variant_id uuid, product_name text, category text, inventory_quantity integer, cogs numeric, throughput_per_unit numeric, avg_days_in_stock numeric, idd numeric, tdd numeric, idd_tdd_ratio numeric, is_capital_trap boolean)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = ''
AS $$
  WITH sales_velocity AS (
    SELECT oli.product_variant_id, SUM(oli.quantity) AS units_sold,
      CASE WHEN COUNT(DISTINCT o.order_date::date) > 1 THEN p_period_days::numeric / NULLIF(COUNT(DISTINCT o.order_date::date), 0) ELSE p_period_days::numeric END AS avg_days_between_sales
    FROM public.order_line_items oli JOIN public.orders o ON o.id = oli.order_id
    WHERE o.organization_id = p_org_id AND o.order_date >= CURRENT_DATE - (p_period_days || ' days')::interval
    GROUP BY oli.product_variant_id
  )
  SELECT vpt.variant_id, vpt.product_name, vpt.category, vpt.inventory_quantity, vpt.cogs, vpt.throughput_per_unit,
    ROUND(COALESCE(vpt.inventory_quantity::numeric / NULLIF(sv.units_sold::numeric / p_period_days, 0), p_period_days::numeric), 1),
    ROUND(vpt.inventory_quantity * vpt.cogs * COALESCE(vpt.inventory_quantity::numeric / NULLIF(sv.units_sold::numeric / p_period_days, 0), p_period_days::numeric), 0),
    ROUND(COALESCE(sv.units_sold, 0) * vpt.throughput_per_unit, 0),
    CASE WHEN COALESCE(sv.units_sold, 0) * vpt.throughput_per_unit > 0 THEN ROUND((vpt.inventory_quantity * vpt.cogs * COALESCE(vpt.inventory_quantity::numeric / NULLIF(sv.units_sold::numeric / p_period_days, 0), p_period_days::numeric)) / (sv.units_sold * vpt.throughput_per_unit), 1) ELSE 999 END,
    CASE WHEN COALESCE(sv.units_sold, 0) * vpt.throughput_per_unit > 0 THEN (vpt.inventory_quantity * vpt.cogs * COALESCE(vpt.inventory_quantity::numeric / NULLIF(sv.units_sold::numeric / p_period_days, 0), p_period_days::numeric)) / (sv.units_sold * vpt.throughput_per_unit) > 5 ELSE true END
  FROM public.v_product_throughput vpt LEFT JOIN sales_velocity sv ON sv.product_variant_id = vpt.variant_id
  WHERE vpt.organization_id = p_org_id ORDER BY idd_tdd_ratio DESC NULLS LAST;
$$;
GRANT EXECUTE ON FUNCTION public.fn_dollar_days TO authenticated;

-- ===================== WEEK 3: SNAPSHOTS + WHAT-IF =====================

-- 12: fn_capture_snapshot + fn_snapshot_history
CREATE OR REPLACE FUNCTION public.fn_capture_snapshot(p_org_id uuid)
RETURNS public.toc_snapshots
LANGUAGE plpgsql SECURITY DEFINER SET search_path = ''
AS $$
DECLARE v_t numeric; v_i numeric; v_oe numeric; v_np numeric; v_roi numeric; v_prod numeric; v_constraint_id uuid; v_result public.toc_snapshots;
BEGIN
  SELECT total_throughput, total_inventory_investment, total_operating_expense, net_profit INTO v_t, v_i, v_oe, v_np FROM public.fn_system_kpis(p_org_id);
  v_roi := CASE WHEN v_i > 0 THEN ROUND((v_np / v_i) * 100, 2) ELSE 0 END;
  v_prod := CASE WHEN v_oe > 0 THEN ROUND(v_t / v_oe, 4) ELSE 0 END;
  SELECT id INTO v_constraint_id FROM public.constraints WHERE organization_id = p_org_id AND is_active = true LIMIT 1;
  INSERT INTO public.toc_snapshots (organization_id, snapshot_date, total_throughput, total_inventory, total_operating_expense, net_profit, roi, productivity, constraint_id, details)
  VALUES (p_org_id, CURRENT_DATE, v_t, v_i, v_oe, v_np, v_roi, v_prod, v_constraint_id,
    jsonb_build_object('product_count', (SELECT count(*) FROM public.product_variants WHERE organization_id = p_org_id AND is_active = true),
    'order_count', (SELECT count(*) FROM public.orders WHERE organization_id = p_org_id AND order_date >= CURRENT_DATE - interval '30 days'),
    'buffer_red_count', (SELECT count(*) FROM public.buffer_targets WHERE organization_id = p_org_id AND current_zone = 'red')))
  RETURNING * INTO v_result;
  RETURN v_result;
END;
$$;

CREATE OR REPLACE FUNCTION public.fn_snapshot_history(p_org_id uuid, p_days integer DEFAULT 90)
RETURNS SETOF public.toc_snapshots
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = ''
AS $$
  SELECT * FROM public.toc_snapshots WHERE organization_id = p_org_id AND snapshot_date >= CURRENT_DATE - (p_days || ' days')::interval ORDER BY snapshot_date ASC;
$$;

GRANT EXECUTE ON FUNCTION public.fn_capture_snapshot TO authenticated;
GRANT EXECUTE ON FUNCTION public.fn_snapshot_history TO authenticated;

-- 13: fn_what_if_price_change
CREATE OR REPLACE FUNCTION public.fn_what_if_price_change(p_org_id uuid, p_variant_ids uuid[], p_price_change_pct numeric)
RETURNS TABLE (variant_id uuid, product_name text, current_price numeric, new_price numeric, current_throughput_per_unit numeric, new_throughput_per_unit numeric, delta_throughput_per_unit numeric, estimated_units_sold bigint, total_throughput_delta numeric)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = ''
AS $$
  WITH sales AS (SELECT oli.product_variant_id, SUM(oli.quantity) AS units_sold FROM public.order_line_items oli JOIN public.orders o ON o.id = oli.order_id WHERE o.organization_id = p_org_id AND o.order_date >= CURRENT_DATE - interval '180 days' GROUP BY oli.product_variant_id)
  SELECT vpt.variant_id, vpt.product_name, vpt.price, ROUND(vpt.price * (1 + p_price_change_pct / 100), 2),
    vpt.throughput_per_unit, ROUND(vpt.price * (1 + p_price_change_pct / 100) - vpt.cogs, 2),
    ROUND(vpt.price * (1 + p_price_change_pct / 100) - vpt.cogs - vpt.throughput_per_unit, 2),
    COALESCE(s.units_sold, 0)::bigint,
    ROUND(COALESCE(s.units_sold, 0) * (vpt.price * (1 + p_price_change_pct / 100) - vpt.cogs - vpt.throughput_per_unit), 2)
  FROM public.v_product_throughput vpt LEFT JOIN sales s ON s.product_variant_id = vpt.variant_id
  WHERE vpt.organization_id = p_org_id AND (p_variant_ids IS NULL OR vpt.variant_id = ANY(p_variant_ids))
  ORDER BY total_throughput_delta DESC;
$$;
GRANT EXECUTE ON FUNCTION public.fn_what_if_price_change TO authenticated;

-- 14: fn_optimal_product_mix
CREATE OR REPLACE FUNCTION public.fn_optimal_product_mix(p_org_id uuid, p_constraint_id uuid)
RETURNS TABLE (variant_id uuid, product_name text, category text, tcu numeric, current_units bigint, current_throughput numeric, recommended_allocation_pct numeric, recommended_units bigint, recommended_throughput numeric, delta_throughput numeric)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = ''
AS $$
DECLARE v_capacity numeric; v_total_spend numeric;
BEGIN
  SELECT c.capacity INTO v_capacity FROM public.constraints c WHERE c.id = p_constraint_id AND c.organization_id = p_org_id;
  SELECT COALESCE(SUM(spend), 0) INTO v_total_spend FROM public.marketing_spend WHERE organization_id = p_org_id AND period_start >= CURRENT_DATE - interval '90 days';
  RETURN QUERY
  WITH rankings AS (SELECT * FROM public.fn_tcu_rankings(p_org_id, p_constraint_id)),
  allocated AS (
    SELECT r.variant_id, r.product_name, r.category, r.tcu, r.total_units_sold AS current_units, r.total_throughput AS current_throughput,
      CASE WHEN SUM(r.tcu) OVER () > 0 THEN ROUND(r.tcu / SUM(r.tcu) OVER () * 100, 1) ELSE 0 END AS recommended_allocation_pct,
      CASE WHEN r.constraint_units_consumed > 0 AND SUM(r.tcu) OVER () > 0 THEN ROUND((r.tcu / SUM(r.tcu) OVER () * v_total_spend) / NULLIF(r.constraint_units_consumed / NULLIF(r.total_units_sold, 0), 0))::bigint ELSE r.total_units_sold END AS recommended_units
    FROM rankings r
  )
  SELECT a.variant_id, a.product_name, a.category, a.tcu, a.current_units, a.current_throughput, a.recommended_allocation_pct, a.recommended_units,
    ROUND(COALESCE(a.recommended_units, 0) * (SELECT vpt.throughput_per_unit FROM public.v_product_throughput vpt WHERE vpt.variant_id = a.variant_id), 2),
    ROUND(COALESCE(a.recommended_units, 0) * (SELECT vpt.throughput_per_unit FROM public.v_product_throughput vpt WHERE vpt.variant_id = a.variant_id) - a.current_throughput, 2)
  FROM allocated a ORDER BY a.tcu DESC;
END;
$$;
GRANT EXECUTE ON FUNCTION public.fn_optimal_product_mix TO authenticated;

-- ===================== WEEK 3: INDEXES + SEED DATA =====================

-- 15: Shopify upsert indexes
CREATE UNIQUE INDEX IF NOT EXISTS idx_orders_external ON public.orders(organization_id, external_id) WHERE external_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_variants_external ON public.product_variants(organization_id, external_id) WHERE external_id IS NOT NULL;

-- Seed 30 days of snapshots (idempotent via ON CONFLICT DO NOTHING)
DO $$
DECLARE d integer; base_t numeric := 45000; base_oe numeric := 11000; base_i numeric := 25000;
BEGIN
  FOR d IN 0..29 LOOP
    INSERT INTO public.toc_snapshots (organization_id, snapshot_date, total_throughput, total_inventory, total_operating_expense, net_profit, roi, productivity)
    VALUES ('a0000000-0000-0000-0000-000000000001', CURRENT_DATE - (d || ' days')::interval,
      base_t + (random() * 5000 - 2500), base_i + (random() * 3000 - 1500), base_oe + (random() * 1000 - 500),
      (base_t + (random() * 5000 - 2500)) - (base_oe + (random() * 1000 - 500)),
      ROUND(((base_t - base_oe) / NULLIF(base_i, 0)) * 100, 2), ROUND((base_t) / NULLIF(base_oe, 0), 4))
    ON CONFLICT DO NOTHING;
  END LOOP;
END; $$;

-- ===================== WEEK 4: TABLES =====================

-- 16: Organization invites
CREATE TABLE IF NOT EXISTS public.organization_invites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  email text NOT NULL, role text NOT NULL DEFAULT 'member',
  token text NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(32), 'hex'),
  invited_by uuid, accepted_at timestamptz,
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '7 days'),
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.organization_invites ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  CREATE POLICY "org_admins_manage_invites" ON public.organization_invites FOR ALL USING (
    organization_id IN (SELECT organization_id FROM public.organization_members WHERE user_id = auth.uid() AND role IN ('owner', 'admin'))
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 17: Subscriptions
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  stripe_customer_id text, stripe_subscription_id text,
  plan text NOT NULL DEFAULT 'starter', status text NOT NULL DEFAULT 'active',
  current_period_end timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  CREATE POLICY "org_members_view_subscription" ON public.subscriptions FOR SELECT USING (
    organization_id IN (SELECT organization_id FROM public.organization_members WHERE user_id = auth.uid())
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
CREATE UNIQUE INDEX IF NOT EXISTS idx_subscriptions_org ON public.subscriptions(organization_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_subscriptions_stripe ON public.subscriptions(stripe_subscription_id) WHERE stripe_subscription_id IS NOT NULL;

-- 18: API keys
CREATE TABLE IF NOT EXISTS public.api_keys (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name text NOT NULL, key_hash text NOT NULL, key_prefix text NOT NULL,
  scopes text[] NOT NULL DEFAULT '{read}', last_used_at timestamptz, expires_at timestamptz,
  created_by uuid, created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.api_keys ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  CREATE POLICY "org_members_manage_keys" ON public.api_keys FOR ALL USING (
    organization_id IN (SELECT organization_id FROM public.organization_members WHERE user_id = auth.uid())
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ===================== WEEK 5: TABLES =====================

-- AI Insights
CREATE TABLE IF NOT EXISTS public.ai_insights (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id),
  type text NOT NULL, content jsonb NOT NULL,
  prompt_tokens int, completion_tokens int,
  generated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.ai_insights ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  CREATE POLICY "org_members_read_own_insights" ON public.ai_insights FOR SELECT USING (
    organization_id = (SELECT organization_id FROM public.organization_members WHERE user_id = auth.uid() LIMIT 1)
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Onboarding progress
CREATE TABLE IF NOT EXISTS public.onboarding_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) UNIQUE,
  step text NOT NULL DEFAULT 'signup', completed_steps text[] NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.onboarding_progress ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  CREATE POLICY "org_members_manage_onboarding" ON public.onboarding_progress FOR ALL USING (
    organization_id = (SELECT organization_id FROM public.organization_members WHERE user_id = auth.uid() LIMIT 1)
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- White-label config
CREATE TABLE IF NOT EXISTS public.whitelabel_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) UNIQUE,
  brand_name text NOT NULL DEFAULT 'Throughput OS', logo_url text,
  primary_color text DEFAULT '#8B5E3C', secondary_color text DEFAULT '#F5F0E8',
  custom_domain text, favicon_url text, support_email text,
  hide_powered_by boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.whitelabel_config ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  CREATE POLICY "org_admins_manage_whitelabel" ON public.whitelabel_config FOR ALL USING (
    organization_id = (SELECT organization_id FROM public.organization_members WHERE user_id = auth.uid() AND role IN ('owner', 'admin') LIMIT 1)
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Changelog
CREATE TABLE IF NOT EXISTS public.changelog_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  version text NOT NULL, title text NOT NULL, summary text NOT NULL, content text NOT NULL,
  category text NOT NULL DEFAULT 'feature',
  published_at timestamptz NOT NULL DEFAULT now(), is_published boolean NOT NULL DEFAULT false
);
CREATE INDEX IF NOT EXISTS idx_changelog_published ON public.changelog_entries(published_at DESC) WHERE is_published = true;

-- Anomalies
CREATE TABLE IF NOT EXISTS public.anomalies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id),
  rule_id text NOT NULL, severity text NOT NULL, message text NOT NULL,
  entity_type text, entity_id uuid, resolved_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.anomalies ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  CREATE POLICY "org_members_read_own_anomalies" ON public.anomalies FOR SELECT USING (
    organization_id = (SELECT organization_id FROM public.organization_members WHERE user_id = auth.uid() LIMIT 1)
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
CREATE INDEX IF NOT EXISTS idx_anomalies_unresolved ON public.anomalies(organization_id, created_at DESC) WHERE resolved_at IS NULL;

-- Production resources
CREATE TABLE IF NOT EXISTS public.production_resources (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id),
  name text NOT NULL, capacity_per_week numeric NOT NULL,
  capacity_unit text NOT NULL DEFAULT 'minutes',
  current_load numeric, is_constraint boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.product_resource_requirements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_variant_id uuid NOT NULL REFERENCES public.product_variants(id),
  resource_id uuid NOT NULL REFERENCES public.production_resources(id),
  minutes_required numeric NOT NULL,
  UNIQUE(product_variant_id, resource_id)
);
ALTER TABLE public.production_resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_resource_requirements ENABLE ROW LEVEL SECURITY;

-- Learning modules
CREATE TABLE IF NOT EXISTS public.learning_modules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE, title text NOT NULL, description text NOT NULL,
  duration_minutes int NOT NULL, order_index int NOT NULL,
  content_type text NOT NULL DEFAULT 'article', content jsonb NOT NULL,
  is_published boolean NOT NULL DEFAULT true
);
CREATE TABLE IF NOT EXISTS public.learning_progress (
  user_id uuid NOT NULL, module_slug text NOT NULL,
  completed_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY(user_id, module_slug)
);

-- Referrals
CREATE TABLE IF NOT EXISTS public.referrals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_org_id uuid NOT NULL REFERENCES public.organizations(id),
  referrer_user_id uuid NOT NULL,
  referral_code text NOT NULL UNIQUE DEFAULT upper(substring(gen_random_uuid()::text, 1, 8)),
  referee_email text, referee_org_id uuid REFERENCES public.organizations(id),
  status text NOT NULL DEFAULT 'pending',
  reward_credited_at timestamptz, created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  CREATE POLICY "org_members_read_own_referrals" ON public.referrals FOR SELECT USING (
    referrer_org_id = (SELECT organization_id FROM public.organization_members WHERE user_id = auth.uid() LIMIT 1)
    OR referee_org_id = (SELECT organization_id FROM public.organization_members WHERE user_id = auth.uid() LIMIT 1)
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Marketplace source columns
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS source text DEFAULT 'shopify';
ALTER TABLE public.order_line_items ADD COLUMN IF NOT EXISTS source text DEFAULT 'shopify';

-- Variable cost adjustments (for Amazon fees etc.)
CREATE TABLE IF NOT EXISTS public.variable_cost_adjustments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES public.orders(id),
  source text NOT NULL, adjustment_type text NOT NULL,
  amount numeric NOT NULL, created_at timestamptz NOT NULL DEFAULT now()
);

-- Feedback
CREATE TABLE IF NOT EXISTS public.feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid REFERENCES public.organizations(id),
  user_id uuid, message text NOT NULL, page_url text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ===================== PERFORMANCE INDEXES =====================
-- Note: IF NOT EXISTS handles re-runs safely
CREATE INDEX IF NOT EXISTS idx_oli_product_variant ON public.order_line_items(product_variant_id);
CREATE INDEX IF NOT EXISTS idx_orders_org_created ON public.orders(organization_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_pv_org ON public.product_variants(organization_id);
