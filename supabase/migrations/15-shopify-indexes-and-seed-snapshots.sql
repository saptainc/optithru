-- ============================================================
-- 15-shopify-indexes-and-seed-snapshots.sql
-- Unique indexes for Shopify upsert + 30 days of demo snapshots
-- Apply via Supabase Studio SQL Editor
-- ============================================================

-- Unique indexes for Shopify order/variant upsert (idempotent syncs)
CREATE UNIQUE INDEX IF NOT EXISTS idx_orders_external
ON public.orders(organization_id, external_id)
WHERE external_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_variants_external
ON public.product_variants(organization_id, external_id)
WHERE external_id IS NOT NULL;

-- Generate 30 days of mock TOC snapshots for the trend chart demo
DO $$
DECLARE
  d integer;
  base_t numeric := 45000;
  base_oe numeric := 11000;
  base_i numeric := 25000;
BEGIN
  FOR d IN 0..29 LOOP
    INSERT INTO public.toc_snapshots (
      organization_id, snapshot_date,
      total_throughput, total_inventory, total_operating_expense,
      net_profit, roi, productivity
    ) VALUES (
      'a0000000-0000-0000-0000-000000000001',
      CURRENT_DATE - (d || ' days')::interval,
      base_t + (random() * 5000 - 2500),
      base_i + (random() * 3000 - 1500),
      base_oe + (random() * 1000 - 500),
      (base_t + (random() * 5000 - 2500)) - (base_oe + (random() * 1000 - 500)),
      ROUND(((base_t - base_oe) / NULLIF(base_i, 0)) * 100, 2),
      ROUND((base_t) / NULLIF(base_oe, 0), 4)
    )
    ON CONFLICT DO NOTHING;
  END LOOP;
END;
$$;
