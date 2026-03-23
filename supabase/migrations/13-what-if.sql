-- ============================================================
-- 13-what-if.sql
-- What-if scenario: price change projection
-- Apply via Supabase Studio SQL Editor
-- ============================================================

CREATE OR REPLACE FUNCTION public.fn_what_if_price_change(
  p_org_id uuid,
  p_variant_ids uuid[],
  p_price_change_pct numeric
)
RETURNS TABLE (
  variant_id uuid,
  product_name text,
  current_price numeric,
  new_price numeric,
  current_throughput_per_unit numeric,
  new_throughput_per_unit numeric,
  delta_throughput_per_unit numeric,
  estimated_units_sold bigint,
  total_throughput_delta numeric
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  WITH sales AS (
    SELECT oli.product_variant_id, SUM(oli.quantity) AS units_sold
    FROM public.order_line_items oli
    JOIN public.orders o ON o.id = oli.order_id
    WHERE o.organization_id = p_org_id
      AND o.order_date >= CURRENT_DATE - interval '180 days'
    GROUP BY oli.product_variant_id
  )
  SELECT
    vpt.variant_id,
    vpt.product_name,
    vpt.price AS current_price,
    ROUND(vpt.price * (1 + p_price_change_pct / 100), 2) AS new_price,
    vpt.throughput_per_unit AS current_throughput_per_unit,
    ROUND(vpt.price * (1 + p_price_change_pct / 100) - vpt.cogs, 2) AS new_throughput_per_unit,
    ROUND(vpt.price * (1 + p_price_change_pct / 100) - vpt.cogs - vpt.throughput_per_unit, 2) AS delta_throughput_per_unit,
    COALESCE(s.units_sold, 0)::bigint AS estimated_units_sold,
    ROUND(COALESCE(s.units_sold, 0) * (vpt.price * (1 + p_price_change_pct / 100) - vpt.cogs - vpt.throughput_per_unit), 2) AS total_throughput_delta
  FROM public.v_product_throughput vpt
  LEFT JOIN sales s ON s.product_variant_id = vpt.variant_id
  WHERE vpt.organization_id = p_org_id
    AND (p_variant_ids IS NULL OR vpt.variant_id = ANY(p_variant_ids))
  ORDER BY total_throughput_delta DESC;
$$;

GRANT EXECUTE ON FUNCTION public.fn_what_if_price_change TO authenticated;
