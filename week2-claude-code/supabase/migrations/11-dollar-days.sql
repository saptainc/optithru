-- ============================================================
-- 11-dollar-days.sql
-- Inventory Dollar Days (IDD) and Throughput Dollar Days (TDD)
-- Identifies capital traps: high IDD/TDD ratio = cash tied up unproductively
-- Apply via Supabase Studio SQL Editor
-- ============================================================

CREATE OR REPLACE FUNCTION public.fn_dollar_days(
  p_org_id uuid,
  p_period_days integer DEFAULT 90
)
RETURNS TABLE (
  variant_id uuid,
  product_name text,
  category text,
  inventory_quantity integer,
  cogs numeric,
  throughput_per_unit numeric,
  avg_days_in_stock numeric,
  idd numeric,
  tdd numeric,
  idd_tdd_ratio numeric,
  is_capital_trap boolean
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  WITH sales_velocity AS (
    SELECT
      oli.product_variant_id,
      SUM(oli.quantity) AS units_sold,
      CASE
        WHEN COUNT(DISTINCT o.order_date::date) > 1
        THEN p_period_days::numeric / NULLIF(COUNT(DISTINCT o.order_date::date), 0)
        ELSE p_period_days::numeric
      END AS avg_days_between_sales
    FROM public.order_line_items oli
    JOIN public.orders o ON o.id = oli.order_id
    WHERE o.organization_id = p_org_id
      AND o.order_date >= CURRENT_DATE - (p_period_days || ' days')::interval
    GROUP BY oli.product_variant_id
  )
  SELECT
    vpt.variant_id,
    vpt.product_name,
    vpt.category,
    vpt.inventory_quantity,
    vpt.cogs,
    vpt.throughput_per_unit,
    ROUND(COALESCE(
      vpt.inventory_quantity::numeric / NULLIF(sv.units_sold::numeric / p_period_days, 0),
      p_period_days::numeric
    ), 1) AS avg_days_in_stock,
    ROUND(
      vpt.inventory_quantity * vpt.cogs *
      COALESCE(vpt.inventory_quantity::numeric / NULLIF(sv.units_sold::numeric / p_period_days, 0), p_period_days::numeric)
    , 0) AS idd,
    ROUND(
      COALESCE(sv.units_sold, 0) * vpt.throughput_per_unit
    , 0) AS tdd,
    CASE
      WHEN COALESCE(sv.units_sold, 0) * vpt.throughput_per_unit > 0
      THEN ROUND(
        (vpt.inventory_quantity * vpt.cogs *
         COALESCE(vpt.inventory_quantity::numeric / NULLIF(sv.units_sold::numeric / p_period_days, 0), p_period_days::numeric))
        / (sv.units_sold * vpt.throughput_per_unit)
      , 1)
      ELSE 999
    END AS idd_tdd_ratio,
    CASE
      WHEN COALESCE(sv.units_sold, 0) * vpt.throughput_per_unit > 0
      THEN (vpt.inventory_quantity * vpt.cogs *
            COALESCE(vpt.inventory_quantity::numeric / NULLIF(sv.units_sold::numeric / p_period_days, 0), p_period_days::numeric))
           / (sv.units_sold * vpt.throughput_per_unit) > 5
      ELSE true
    END AS is_capital_trap
  FROM public.v_product_throughput vpt
  LEFT JOIN sales_velocity sv ON sv.product_variant_id = vpt.variant_id
  WHERE vpt.organization_id = p_org_id
  ORDER BY idd_tdd_ratio DESC NULLS LAST;
$$;

GRANT EXECUTE ON FUNCTION public.fn_dollar_days TO authenticated;
