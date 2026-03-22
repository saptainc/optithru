-- ============================================================
-- 10-buffer-management.sql
-- TOC Dynamic Buffer Management: calculate buffer targets per SKU
-- Apply via Supabase Studio SQL Editor
-- ============================================================

CREATE OR REPLACE FUNCTION public.fn_calculate_buffers(p_org_id uuid)
RETURNS TABLE (
  variant_id uuid,
  product_name text,
  category text,
  image_url text,
  inventory_quantity integer,
  avg_daily_usage numeric,
  lead_time_days integer,
  buffer_quantity integer,
  green_zone_qty integer,
  yellow_zone_qty integer,
  red_zone_qty integer,
  current_zone text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  r record;
  v_adu numeric;
  v_buffer integer;
  v_zone_size integer;
  v_lead_time integer;
  v_zone text;
BEGIN
  FOR r IN
    SELECT
      vpt.variant_id,
      vpt.product_name,
      vpt.category,
      vpt.image_url,
      vpt.inventory_quantity,
      COALESCE(
        (SELECT SUM(oli.quantity)::numeric
         FROM public.order_line_items oli
         JOIN public.orders o ON o.id = oli.order_id
         WHERE oli.product_variant_id = vpt.variant_id
           AND o.organization_id = p_org_id
           AND o.order_date >= CURRENT_DATE - interval '90 days')
        / 90.0, 0.1
      ) AS adu
    FROM public.v_product_throughput vpt
    WHERE vpt.organization_id = p_org_id
  LOOP
    v_adu := r.adu;
    v_lead_time := 14;

    v_buffer := GREATEST(CEIL(v_adu * v_lead_time * 1.5), 1);
    v_zone_size := v_buffer / 3;

    IF r.inventory_quantity <= v_zone_size THEN
      v_zone := 'red';
    ELSIF r.inventory_quantity <= v_zone_size * 2 THEN
      v_zone := 'yellow';
    ELSE
      v_zone := 'green';
    END IF;

    INSERT INTO public.buffer_targets (
      organization_id, product_variant_id,
      buffer_quantity, green_zone_qty, yellow_zone_qty, red_zone_qty,
      current_zone, avg_daily_usage, lead_time_days, last_adjustment_date
    ) VALUES (
      p_org_id, r.variant_id,
      v_buffer, v_buffer - (2 * v_zone_size), v_zone_size, v_zone_size,
      v_zone::public.buffer_zone, v_adu, v_lead_time, NOW()
    )
    ON CONFLICT (organization_id, product_variant_id)
    DO UPDATE SET
      buffer_quantity = EXCLUDED.buffer_quantity,
      green_zone_qty = EXCLUDED.green_zone_qty,
      yellow_zone_qty = EXCLUDED.yellow_zone_qty,
      red_zone_qty = EXCLUDED.red_zone_qty,
      current_zone = EXCLUDED.current_zone,
      avg_daily_usage = EXCLUDED.avg_daily_usage,
      last_adjustment_date = EXCLUDED.last_adjustment_date;

    variant_id := r.variant_id;
    product_name := r.product_name;
    category := r.category;
    image_url := r.image_url;
    inventory_quantity := r.inventory_quantity;
    avg_daily_usage := ROUND(v_adu, 2);
    lead_time_days := v_lead_time;
    buffer_quantity := v_buffer;
    green_zone_qty := v_buffer - (2 * v_zone_size);
    yellow_zone_qty := v_zone_size;
    red_zone_qty := v_zone_size;
    current_zone := v_zone;
    RETURN NEXT;
  END LOOP;
END;
$$;

-- Unique constraint for upsert
CREATE UNIQUE INDEX IF NOT EXISTS idx_buffers_org_variant
ON public.buffer_targets(organization_id, product_variant_id);

GRANT EXECUTE ON FUNCTION public.fn_calculate_buffers TO authenticated;
