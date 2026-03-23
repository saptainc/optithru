-- ============================================================
-- 12-toc-snapshots.sql
-- TOC metric snapshot capture and history retrieval
-- Apply via Supabase Studio SQL Editor
-- ============================================================

CREATE OR REPLACE FUNCTION public.fn_capture_snapshot(p_org_id uuid)
RETURNS public.toc_snapshots
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_t numeric;
  v_i numeric;
  v_oe numeric;
  v_np numeric;
  v_roi numeric;
  v_prod numeric;
  v_constraint_id uuid;
  v_result public.toc_snapshots;
BEGIN
  SELECT total_throughput, total_inventory_investment, total_operating_expense, net_profit
  INTO v_t, v_i, v_oe, v_np
  FROM public.fn_system_kpis(p_org_id);

  v_roi := CASE WHEN v_i > 0 THEN ROUND((v_np / v_i) * 100, 2) ELSE 0 END;
  v_prod := CASE WHEN v_oe > 0 THEN ROUND(v_t / v_oe, 4) ELSE 0 END;

  SELECT id INTO v_constraint_id
  FROM public.constraints
  WHERE organization_id = p_org_id AND is_active = true
  LIMIT 1;

  INSERT INTO public.toc_snapshots (
    organization_id, snapshot_date,
    total_throughput, total_inventory, total_operating_expense,
    net_profit, roi, productivity, constraint_id,
    details
  ) VALUES (
    p_org_id, CURRENT_DATE,
    v_t, v_i, v_oe, v_np, v_roi, v_prod, v_constraint_id,
    jsonb_build_object(
      'product_count', (SELECT count(*) FROM public.product_variants WHERE organization_id = p_org_id AND is_active = true),
      'order_count', (SELECT count(*) FROM public.orders WHERE organization_id = p_org_id AND order_date >= CURRENT_DATE - interval '30 days'),
      'buffer_red_count', (SELECT count(*) FROM public.buffer_targets WHERE organization_id = p_org_id AND current_zone = 'red')
    )
  )
  RETURNING * INTO v_result;

  RETURN v_result;
END;
$$;

CREATE OR REPLACE FUNCTION public.fn_snapshot_history(
  p_org_id uuid,
  p_days integer DEFAULT 90
)
RETURNS SETOF public.toc_snapshots
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT *
  FROM public.toc_snapshots
  WHERE organization_id = p_org_id
    AND snapshot_date >= CURRENT_DATE - (p_days || ' days')::interval
  ORDER BY snapshot_date ASC;
$$;

GRANT EXECUTE ON FUNCTION public.fn_capture_snapshot TO authenticated;
GRANT EXECUTE ON FUNCTION public.fn_snapshot_history TO authenticated;
