-- ============================================================
-- 14-product-mix-optimizer.sql
-- Optimal product mix using greedy T/CU allocation
-- Apply via Supabase Studio SQL Editor
-- ============================================================

CREATE OR REPLACE FUNCTION public.fn_optimal_product_mix(
  p_org_id uuid,
  p_constraint_id uuid
)
RETURNS TABLE (
  variant_id uuid,
  product_name text,
  category text,
  tcu numeric,
  current_units bigint,
  current_throughput numeric,
  recommended_allocation_pct numeric,
  recommended_units bigint,
  recommended_throughput numeric,
  delta_throughput numeric
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_capacity numeric;
  v_total_spend numeric;
BEGIN
  SELECT c.capacity INTO v_capacity
  FROM public.constraints c
  WHERE c.id = p_constraint_id AND c.organization_id = p_org_id;

  SELECT COALESCE(SUM(spend), 0) INTO v_total_spend
  FROM public.marketing_spend
  WHERE organization_id = p_org_id
    AND period_start >= CURRENT_DATE - interval '90 days';

  RETURN QUERY
  WITH rankings AS (
    SELECT * FROM public.fn_tcu_rankings(p_org_id, p_constraint_id)
  ),
  allocated AS (
    SELECT
      r.variant_id,
      r.product_name,
      r.category,
      r.tcu,
      r.total_units_sold AS current_units,
      r.total_throughput AS current_throughput,
      CASE
        WHEN SUM(r.tcu) OVER () > 0
        THEN ROUND(r.tcu / SUM(r.tcu) OVER () * 100, 1)
        ELSE 0
      END AS recommended_allocation_pct,
      CASE
        WHEN r.constraint_units_consumed > 0 AND SUM(r.tcu) OVER () > 0
        THEN ROUND(
          (r.tcu / SUM(r.tcu) OVER () * v_total_spend) / NULLIF(r.constraint_units_consumed / NULLIF(r.total_units_sold, 0), 0)
        )::bigint
        ELSE r.total_units_sold
      END AS recommended_units
    FROM rankings r
  )
  SELECT
    a.variant_id,
    a.product_name,
    a.category,
    a.tcu,
    a.current_units,
    a.current_throughput,
    a.recommended_allocation_pct,
    a.recommended_units,
    ROUND(COALESCE(a.recommended_units, 0) * (
      SELECT vpt.throughput_per_unit FROM public.v_product_throughput vpt WHERE vpt.variant_id = a.variant_id
    ), 2) AS recommended_throughput,
    ROUND(COALESCE(a.recommended_units, 0) * (
      SELECT vpt.throughput_per_unit FROM public.v_product_throughput vpt WHERE vpt.variant_id = a.variant_id
    ) - a.current_throughput, 2) AS delta_throughput
  FROM allocated a
  ORDER BY a.tcu DESC;
END;
$$;

GRANT EXECUTE ON FUNCTION public.fn_optimal_product_mix TO authenticated;
