-- ============================================================
-- 07-rpc-functions.sql
-- Throughput OS: RPC functions for dashboard KPIs
-- Apply via Supabase Studio SQL Editor at https://supabase.1in3in5.org
-- ============================================================

-- Function 1: Product throughput summary for a date range
CREATE OR REPLACE FUNCTION public.fn_product_throughput_summary(
  p_org_id uuid,
  p_start_date date DEFAULT (CURRENT_DATE - interval '180 days')::date,
  p_end_date date DEFAULT CURRENT_DATE
)
RETURNS TABLE (
  product_id uuid,
  product_name text,
  category text,
  image_url text,
  price numeric,
  cogs numeric,
  throughput_per_unit numeric,
  throughput_margin_pct numeric,
  total_units_sold bigint,
  total_revenue numeric,
  total_throughput numeric,
  inventory_quantity integer,
  inventory_investment numeric
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT
    vpt.product_id,
    vpt.product_name,
    vpt.category,
    vpt.image_url,
    vpt.price,
    vpt.cogs,
    vpt.throughput_per_unit,
    vpt.throughput_margin_pct,
    COALESCE(agg.total_units, 0)::bigint AS total_units_sold,
    COALESCE(agg.total_rev, 0) AS total_revenue,
    COALESCE(agg.total_units * vpt.throughput_per_unit, 0) AS total_throughput,
    vpt.inventory_quantity,
    vpt.inventory_investment
  FROM public.v_product_throughput vpt
  LEFT JOIN (
    SELECT
      oli.product_variant_id,
      SUM(oli.quantity) AS total_units,
      SUM(oli.total_price) AS total_rev
    FROM public.order_line_items oli
    JOIN public.orders o ON o.id = oli.order_id
    WHERE o.organization_id = p_org_id
      AND o.order_date::date BETWEEN p_start_date AND p_end_date
      AND o.financial_status = 'paid'
    GROUP BY oli.product_variant_id
  ) agg ON agg.product_variant_id = vpt.variant_id
  WHERE vpt.organization_id = p_org_id
  ORDER BY total_throughput DESC NULLS LAST;
$$;

-- Function 2: System-wide KPIs
CREATE OR REPLACE FUNCTION public.fn_system_kpis(
  p_org_id uuid,
  p_start_date date DEFAULT (CURRENT_DATE - interval '180 days')::date,
  p_end_date date DEFAULT CURRENT_DATE
)
RETURNS TABLE (
  total_throughput numeric,
  total_inventory_investment numeric,
  total_operating_expense numeric,
  net_profit numeric,
  product_count bigint,
  order_count bigint,
  total_units_sold bigint,
  total_revenue numeric
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT
    COALESCE((
      SELECT SUM(oli.quantity * vpt.throughput_per_unit)
      FROM public.order_line_items oli
      JOIN public.orders o ON o.id = oli.order_id
      JOIN public.v_product_throughput vpt ON vpt.variant_id = oli.product_variant_id
      WHERE o.organization_id = p_org_id
        AND o.order_date::date BETWEEN p_start_date AND p_end_date
        AND o.financial_status = 'paid'
    ), 0) AS total_throughput,

    COALESCE((
      SELECT SUM(pv.inventory_quantity * pv.cogs)
      FROM public.product_variants pv
      WHERE pv.organization_id = p_org_id AND pv.is_active = true
    ), 0) AS total_inventory_investment,

    COALESCE((
      SELECT SUM(ms.spend)
      FROM public.marketing_spend ms
      WHERE ms.organization_id = p_org_id
        AND ms.period_start >= p_start_date
        AND ms.period_end <= p_end_date
    ), 0) AS total_operating_expense,

    COALESCE((
      SELECT SUM(oli.quantity * vpt.throughput_per_unit)
      FROM public.order_line_items oli
      JOIN public.orders o ON o.id = oli.order_id
      JOIN public.v_product_throughput vpt ON vpt.variant_id = oli.product_variant_id
      WHERE o.organization_id = p_org_id
        AND o.order_date::date BETWEEN p_start_date AND p_end_date
        AND o.financial_status = 'paid'
    ), 0)
    -
    COALESCE((
      SELECT SUM(ms.spend)
      FROM public.marketing_spend ms
      WHERE ms.organization_id = p_org_id
        AND ms.period_start >= p_start_date
        AND ms.period_end <= p_end_date
    ), 0) AS net_profit,

    (SELECT count(*) FROM public.product_variants WHERE organization_id = p_org_id AND is_active = true),
    (SELECT count(*) FROM public.orders WHERE organization_id = p_org_id AND order_date::date BETWEEN p_start_date AND p_end_date),
    COALESCE((
      SELECT SUM(oli.quantity)
      FROM public.order_line_items oli
      JOIN public.orders o ON o.id = oli.order_id
      WHERE o.organization_id = p_org_id AND o.order_date::date BETWEEN p_start_date AND p_end_date
    ), 0),
    COALESCE((
      SELECT SUM(o.total)
      FROM public.orders o
      WHERE o.organization_id = p_org_id AND o.order_date::date BETWEEN p_start_date AND p_end_date
    ), 0);
$$;

GRANT EXECUTE ON FUNCTION public.fn_product_throughput_summary TO authenticated;
GRANT EXECUTE ON FUNCTION public.fn_system_kpis TO authenticated;
