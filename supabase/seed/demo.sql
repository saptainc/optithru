-- Demo data for Shankara Naturals — idempotent.
-- Run after migrations have been applied.

-- ── Demo organization ──
INSERT INTO public.organizations (id, name, slug)
VALUES ('a0000000-0000-0000-0000-000000000001', 'Shankara Naturals', 'shankara')
ON CONFLICT (id) DO NOTHING;

-- ── Products (parent table) ──
INSERT INTO public.products (id, organization_id, name, category) VALUES
  ('b0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'Kumkumadi Rejuvenating Oil', 'Face Care'),
  ('b0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001', 'Hydrating Moisturizer', 'Face Care'),
  ('b0000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000001', 'Calming Body Oil', 'Body Care'),
  ('b0000000-0000-0000-0000-000000000004', 'a0000000-0000-0000-0000-000000000001', 'Nourishing Shampoo', 'Hair Care'),
  ('b0000000-0000-0000-0000-000000000005', 'a0000000-0000-0000-0000-000000000001', 'Enriching Conditioner', 'Hair Care'),
  ('b0000000-0000-0000-0000-000000000006', 'a0000000-0000-0000-0000-000000000001', 'Soothing Face Cleanser', 'Face Care'),
  ('b0000000-0000-0000-0000-000000000007', 'a0000000-0000-0000-0000-000000000001', 'Timeless Anti-Aging Serum', 'Face Care'),
  ('b0000000-0000-0000-0000-000000000008', 'a0000000-0000-0000-0000-000000000001', 'Brightening Day Cream', 'Face Care'),
  ('b0000000-0000-0000-0000-000000000009', 'a0000000-0000-0000-0000-000000000001', 'Repairing Night Cream', 'Face Care'),
  ('b0000000-0000-0000-0000-000000000010', 'a0000000-0000-0000-0000-000000000001', 'Exfoliating Scrub', 'Body Care'),
  ('b0000000-0000-0000-0000-000000000011', 'a0000000-0000-0000-0000-000000000001', 'Sunscreen SPF 30', 'Face Care'),
  ('b0000000-0000-0000-0000-000000000012', 'a0000000-0000-0000-0000-000000000001', 'Lip Balm Trio', 'Lip Care')
ON CONFLICT (id) DO NOTHING;

-- ── Product variants ──
INSERT INTO public.product_variants (id, organization_id, product_id, name, sku, price, cogs, shipping_cost, inventory_quantity) VALUES
  (gen_random_uuid(), 'a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'Kumkumadi Rejuvenating Oil 30ml', 'SK-KUM-30ML', 85.00, 18.50, 5.00, 120),
  (gen_random_uuid(), 'a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000002', 'Hydrating Moisturizer 50ml', 'SK-HYD-50ML', 42.00, 8.20, 4.50, 200),
  (gen_random_uuid(), 'a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000003', 'Calming Body Oil 100ml', 'SK-CBO-100ML', 38.00, 7.80, 5.50, 85),
  (gen_random_uuid(), 'a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000004', 'Nourishing Shampoo 250ml', 'SK-NSH-250ML', 28.00, 5.40, 4.00, 310),
  (gen_random_uuid(), 'a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000005', 'Enriching Conditioner 250ml', 'SK-ECN-250ML', 28.00, 5.80, 4.00, 290),
  (gen_random_uuid(), 'a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000006', 'Soothing Face Cleanser 100ml', 'SK-SFC-100ML', 32.00, 6.50, 4.50, 175),
  (gen_random_uuid(), 'a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000007', 'Timeless Anti-Aging Serum 30ml', 'SK-TAS-30ML', 95.00, 22.00, 5.00, 60),
  (gen_random_uuid(), 'a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000008', 'Brightening Day Cream 50ml', 'SK-BDC-50ML', 52.00, 11.00, 4.50, 140),
  (gen_random_uuid(), 'a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000009', 'Repairing Night Cream 50ml', 'SK-RNC-50ML', 58.00, 13.50, 4.50, 95),
  (gen_random_uuid(), 'a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000010', 'Exfoliating Scrub 200ml', 'SK-EXS-200ML', 34.00, 6.00, 5.00, 220),
  (gen_random_uuid(), 'a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000011', 'Sunscreen SPF 30 50ml', 'SK-SS30-50ML', 36.00, 9.50, 4.50, 260),
  (gen_random_uuid(), 'a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000012', 'Lip Balm Trio 3pk', 'SK-LBT-3PK', 18.00, 3.20, 3.50, 450)
ON CONFLICT DO NOTHING;

-- ── 30 days of orders with line items ──
DO $$
DECLARE
  v_org_id uuid := 'a0000000-0000-0000-0000-000000000001';
  v_variant RECORD;
  v_order_id uuid;
  v_channels text[] := ARRAY['dtc_website', 'amazon', 'wholesale_spa', 'email'];
  v_day integer;
  v_qty integer;
BEGIN
  FOR v_day IN 1..30 LOOP
    FOR v_variant IN
      SELECT pv.id, pv.price, pv.name, pv.sku FROM public.product_variants pv
      WHERE pv.organization_id = v_org_id
      ORDER BY random() LIMIT (2 + floor(random() * 4)::int)
    LOOP
      v_order_id := gen_random_uuid();
      v_qty := 1 + floor(random() * 3)::int;
      INSERT INTO public.orders (id, organization_id, order_number, order_date, total, channel, source)
      VALUES (
        v_order_id, v_org_id,
        'ORD-' || to_char(CURRENT_DATE - v_day, 'YYMMDD') || '-' || substr(v_order_id::text, 1, 4),
        (CURRENT_DATE - v_day)::timestamp,
        v_variant.price * v_qty,
        v_channels[1 + floor(random() * array_length(v_channels, 1))::int]::channel_type,
        'seed'
      ) ON CONFLICT DO NOTHING;

      INSERT INTO public.order_line_items (id, organization_id, order_id, product_variant_id, product_name, sku, quantity, unit_price, total_price, source)
      VALUES (
        gen_random_uuid(), v_org_id, v_order_id, v_variant.id,
        v_variant.name, v_variant.sku,
        v_qty, v_variant.price, v_variant.price * v_qty, 'seed'
      ) ON CONFLICT DO NOTHING;
    END LOOP;
  END LOOP;
END $$;

-- ── Marketing spend (last 30 days) ──
INSERT INTO public.marketing_spend (id, organization_id, channel, period_start, period_end, spend, revenue_attributed, conversions)
VALUES
  (gen_random_uuid(), 'a0000000-0000-0000-0000-000000000001', 'email',     CURRENT_DATE - 30, CURRENT_DATE,  500, 18000, 120),
  (gen_random_uuid(), 'a0000000-0000-0000-0000-000000000001', 'meta_ads',  CURRENT_DATE - 30, CURRENT_DATE, 8000, 22000,  85),
  (gen_random_uuid(), 'a0000000-0000-0000-0000-000000000001', 'google_ads',CURRENT_DATE - 30, CURRENT_DATE, 6000, 19500,  70),
  (gen_random_uuid(), 'a0000000-0000-0000-0000-000000000001', 'seo',       CURRENT_DATE - 30, CURRENT_DATE,  200,  4500,  30),
  (gen_random_uuid(), 'a0000000-0000-0000-0000-000000000001', 'affiliate', CURRENT_DATE - 30, CURRENT_DATE, 1500,  7200,  45)
ON CONFLICT DO NOTHING;

-- ── Active constraint ──
INSERT INTO public.constraints (id, organization_id, name, type, capacity, is_active)
VALUES (gen_random_uuid(), 'a0000000-0000-0000-0000-000000000001', '2oz Liquid Filling Machine', 'production_capacity', 480, true)
ON CONFLICT DO NOTHING;

-- ── 30 days of TOC snapshots for the trend chart ──
DO $$
DECLARE
  v_org uuid := 'a0000000-0000-0000-0000-000000000001';
  v_day integer;
  v_t numeric; v_oe numeric; v_inv numeric;
BEGIN
  FOR v_day IN REVERSE 30..1 LOOP
    v_t   := 85000 + (random() * 15000)::numeric;
    v_oe  := 28000 + (random() *  8000)::numeric;
    v_inv := 40000 + (random() * 10000)::numeric;
    INSERT INTO public.toc_snapshots (id, organization_id, snapshot_date, total_throughput, net_profit, total_inventory, total_operating_expense)
    VALUES (gen_random_uuid(), v_org, CURRENT_DATE - v_day, v_t, v_t - v_oe, v_inv, v_oe)
    ON CONFLICT DO NOTHING;
  END LOOP;
END $$;
