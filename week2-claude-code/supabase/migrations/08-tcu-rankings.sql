-- ============================================================
-- 08-tcu-rankings.sql
-- T/CU rankings: products ranked by throughput per constraint unit
-- Apply via Supabase Studio SQL Editor
-- ============================================================

CREATE OR REPLACE FUNCTION public.fn_tcu_rankings(
  p_org_id uuid,
  p_constraint_id uuid
)
RETURNS TABLE (
  variant_id uuid,
  product_name text,
  category text,
  image_url text,
  price numeric,
  throughput_per_unit numeric,
  constraint_units_consumed numeric,
  tcu numeric,
  priority_rank bigint,
  total_units_sold bigint,
  total_throughput numeric
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_constraint_type text;
  v_constraint_capacity numeric;
BEGIN
  SELECT c.type, c.capacity INTO v_constraint_type, v_constraint_capacity
  FROM public.constraints c
  WHERE c.id = p_constraint_id AND c.organization_id = p_org_id;

  IF v_constraint_type = 'marketing_budget' THEN
    RETURN QUERY
    WITH product_sales AS (
      SELECT
        oli.product_variant_id,
        SUM(oli.quantity) AS units_sold,
        SUM(oli.total_price) AS revenue
      FROM public.order_line_items oli
      JOIN public.orders o ON o.id = oli.order_id
      WHERE o.organization_id = p_org_id
        AND o.order_date >= CURRENT_DATE - interval '180 days'
      GROUP BY oli.product_variant_id
    ),
    total_revenue AS (
      SELECT COALESCE(SUM(revenue), 1) AS total_rev FROM product_sales
    ),
    total_spend AS (
      SELECT COALESCE(SUM(spend), 1) AS total_sp
      FROM public.marketing_spend
      WHERE organization_id = p_org_id
        AND period_start >= CURRENT_DATE - interval '180 days'
    )
    SELECT
      vpt.variant_id,
      vpt.product_name,
      vpt.category,
      vpt.image_url,
      vpt.price,
      vpt.throughput_per_unit,
      ROUND((COALESCE(ps.revenue, 0) / tr.total_rev * ts.total_sp)::numeric, 2) AS constraint_units_consumed,
      CASE
        WHEN COALESCE(ps.revenue, 0) = 0 THEN 0
        ELSE ROUND(
          (COALESCE(ps.units_sold, 0) * vpt.throughput_per_unit)
          / NULLIF(ps.revenue / tr.total_rev * ts.total_sp, 0)
        , 2)
      END AS tcu,
      ROW_NUMBER() OVER (ORDER BY
        CASE
          WHEN COALESCE(ps.revenue, 0) = 0 THEN 0
          ELSE (COALESCE(ps.units_sold, 0) * vpt.throughput_per_unit)
               / NULLIF(ps.revenue / tr.total_rev * ts.total_sp, 0)
        END DESC NULLS LAST
      ) AS priority_rank,
      COALESCE(ps.units_sold, 0)::bigint AS total_units_sold,
      ROUND(COALESCE(ps.units_sold, 0) * vpt.throughput_per_unit, 2) AS total_throughput
    FROM public.v_product_throughput vpt
    LEFT JOIN product_sales ps ON ps.product_variant_id = vpt.variant_id
    CROSS JOIN total_revenue tr
    CROSS JOIN total_spend ts
    WHERE vpt.organization_id = p_org_id
    ORDER BY tcu DESC NULLS LAST;

  ELSIF v_constraint_type = 'inventory_capital' THEN
    RETURN QUERY
    WITH product_sales AS (
      SELECT
        oli.product_variant_id,
        SUM(oli.quantity) AS units_sold
      FROM public.order_line_items oli
      JOIN public.orders o ON o.id = oli.order_id
      WHERE o.organization_id = p_org_id
        AND o.order_date >= CURRENT_DATE - interval '180 days'
      GROUP BY oli.product_variant_id
    )
    SELECT
      vpt.variant_id,
      vpt.product_name,
      vpt.category,
      vpt.image_url,
      vpt.price,
      vpt.throughput_per_unit,
      vpt.inventory_investment AS constraint_units_consumed,
      CASE
        WHEN vpt.inventory_investment <= 0 THEN 0
        ELSE ROUND(
          (COALESCE(ps.units_sold, 0) * vpt.throughput_per_unit) / vpt.inventory_investment
        , 2)
      END AS tcu,
      ROW_NUMBER() OVER (ORDER BY
        CASE
          WHEN vpt.inventory_investment <= 0 THEN 0
          ELSE (COALESCE(ps.units_sold, 0) * vpt.throughput_per_unit) / vpt.inventory_investment
        END DESC NULLS LAST
      ) AS priority_rank,
      COALESCE(ps.units_sold, 0)::bigint AS total_units_sold,
      ROUND(COALESCE(ps.units_sold, 0) * vpt.throughput_per_unit, 2) AS total_throughput
    FROM public.v_product_throughput vpt
    LEFT JOIN product_sales ps ON ps.product_variant_id = vpt.variant_id
    WHERE vpt.organization_id = p_org_id
    ORDER BY tcu DESC NULLS LAST;

  ELSE
    RETURN QUERY
    SELECT
      vpt.variant_id,
      vpt.product_name,
      vpt.category,
      vpt.image_url,
      vpt.price,
      vpt.throughput_per_unit,
      1::numeric AS constraint_units_consumed,
      vpt.throughput_per_unit AS tcu,
      ROW_NUMBER() OVER (ORDER BY vpt.throughput_per_unit DESC) AS priority_rank,
      0::bigint AS total_units_sold,
      0::numeric AS total_throughput
    FROM public.v_product_throughput vpt
    WHERE vpt.organization_id = p_org_id
    ORDER BY tcu DESC;
  END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION public.fn_tcu_rankings TO authenticated;
