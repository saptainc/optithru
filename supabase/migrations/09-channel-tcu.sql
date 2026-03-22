-- ============================================================
-- 09-channel-tcu.sql
-- Marketing channel T/CU: throughput per dollar of spend by channel
-- Apply via Supabase Studio SQL Editor
-- ============================================================

CREATE OR REPLACE FUNCTION public.fn_channel_tcu(
  p_org_id uuid,
  p_start_date date DEFAULT (CURRENT_DATE - interval '90 days')::date,
  p_end_date date DEFAULT CURRENT_DATE
)
RETURNS TABLE (
  channel text,
  total_spend numeric,
  total_revenue numeric,
  estimated_throughput numeric,
  tcu numeric,
  conversions bigint,
  cpa numeric,
  roas numeric
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  WITH channel_data AS (
    SELECT
      ms.channel::text,
      SUM(ms.spend) AS total_spend,
      SUM(ms.revenue_attributed) AS total_revenue,
      SUM(ms.conversions) AS conversions
    FROM public.marketing_spend ms
    WHERE ms.organization_id = p_org_id
      AND ms.period_start >= p_start_date
      AND ms.period_end <= p_end_date
    GROUP BY ms.channel
  ),
  avg_margin AS (
    SELECT COALESCE(
      AVG(vpt.throughput_margin_pct) / 100.0, 0.55
    ) AS margin_pct
    FROM public.v_product_throughput vpt
    WHERE vpt.organization_id = p_org_id
  )
  SELECT
    cd.channel,
    cd.total_spend,
    cd.total_revenue,
    ROUND((cd.total_revenue * am.margin_pct)::numeric, 2) AS estimated_throughput,
    CASE
      WHEN cd.total_spend > 0
      THEN ROUND((cd.total_revenue * am.margin_pct / cd.total_spend)::numeric, 2)
      ELSE 0
    END AS tcu,
    cd.conversions,
    CASE
      WHEN cd.conversions > 0
      THEN ROUND((cd.total_spend / cd.conversions)::numeric, 2)
      ELSE 0
    END AS cpa,
    CASE
      WHEN cd.total_spend > 0
      THEN ROUND((cd.total_revenue / cd.total_spend)::numeric, 2)
      ELSE 0
    END AS roas
  FROM channel_data cd
  CROSS JOIN avg_margin am
  ORDER BY tcu DESC;
$$;

GRANT EXECUTE ON FUNCTION public.fn_channel_tcu TO authenticated;
