# Card #79: Extend TOC model for manufacturing constraints with production resource tracking

**Fizzy URL**: https://fizzy.sapta.com/1/cards/79  
**Time Estimate**: 5 hours

---

## Goal
Add quantitative production constraint support: machine hours, formulation time, team capacity. Unlocks Throughput OS for manufacturers (Shankara makes Ayurvedic products), not just resellers.

## Step 1: Migration 23
File: `supabase/migrations/23-production.sql`
```sql
CREATE TABLE IF NOT EXISTS public.production_resources (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id),
  name text NOT NULL,
  capacity_per_week numeric NOT NULL,
  capacity_unit text NOT NULL DEFAULT 'minutes',
  current_load numeric,
  is_constraint boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.product_resource_requirements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_variant_id uuid NOT NULL REFERENCES public.product_variants(id),
  resource_id uuid NOT NULL REFERENCES public.production_resources(id),
  minutes_required numeric NOT NULL,
  UNIQUE(product_variant_id, resource_id)
);
ALTER TABLE public.production_resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_resource_requirements ENABLE ROW LEVEL SECURITY;
```

## Step 2: Production T/CU in RPC
When constraint type = 'production':
```sql
T/CU = t_per_unit / COALESCE(
  (SELECT prr.minutes_required
   FROM product_resource_requirements prr
   JOIN production_resources pr ON pr.id = prr.resource_id
   WHERE prr.product_variant_id = pv.id AND pr.is_constraint = true
     AND pr.organization_id = p_org_id LIMIT 1),
  1  -- fallback
)
```

## Step 3: /dashboard/production page
File: `src/app/dashboard/production/page.tsx`

- Resource table: name, capacity/week, current load, utilization % bar, constraint badge
- "Add Resource" form
- Product requirements table (editable: product x minutes per resource)
- Bottleneck: highlighted card for is_constraint=true resource

## Step 4: "Add Production Capacity" What-If tab
New tab in What-If Simulator:
- Select resource + input additional minutes/week
- Output: Delta-T = additional_units_possible * T_per_unit
- Show: "500 extra minutes/week of Formulation Lab = +42,000 INR/month throughput"

## Step 5: Production context in AI insights
Update AIInsightsService._build_context() to include production resources.
Prompt improvement: "The binding constraint is [resource] at [X]% utilization. Highest T/CU product needing it is [product]..."

## Done When
- Production resources can be defined with capacity
- Product resource requirements settable per variant
- T/CU uses production minutes when production constraint is active
- /dashboard/production shows utilization and bottleneck
- "Add Capacity" what-if calculates Delta-T correctly
- uv run pytest -v passes
