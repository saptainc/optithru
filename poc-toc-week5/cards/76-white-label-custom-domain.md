# Card #76: Build white-label branding system with custom domain support for Scale plan

**Fizzy URL**: https://fizzy.sapta.com/1/cards/76  
**Time Estimate**: 5 hours

---

## Goal
Scale plan ($599/mo) customers replace Throughput OS branding with their own logo, colors, and custom domain.

## Step 1: Migration 20
File: `supabase/migrations/20-whitelabel.sql`
```sql
CREATE TABLE IF NOT EXISTS public.whitelabel_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) UNIQUE,
  brand_name text NOT NULL DEFAULT 'Throughput OS',
  logo_url text,
  primary_color text DEFAULT '#8B5E3C',
  secondary_color text DEFAULT '#F5F0E8',
  custom_domain text,
  favicon_url text,
  support_email text,
  hide_powered_by boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.whitelabel_config ENABLE ROW LEVEL SECURITY;
```

## Step 2: Dynamic CSS variable injection
File: `src/lib/theme.ts`
```typescript
export async function applyWhitelabelTheme(supabase: any, orgId: string) {
  const { data: config } = await supabase
    .from("whitelabel_config").select("*").eq("organization_id", orgId).single()
  if (!config) return
  const root = document.documentElement
  root.style.setProperty("--primary", hexToHsl(config.primary_color))
  root.style.setProperty("--secondary", hexToHsl(config.secondary_color))
  if (config.brand_name) document.title = config.brand_name
}
```

Call in root client layout on mount.

## Step 3: Logo upload
Settings -> Branding tab (Scale plan only).
Upload to Supabase Storage bucket "whitelabel-assets".
Replace sidebar logo + login page logo with config.logo_url.

## Step 4: Custom domain via Vercel API
```python
@router.post("/api/v1/whitelabel/domain")
async def add_custom_domain(req: DomainRequest, user=Depends(require_scale_plan)):
    r = httpx.post(
        f"https://api.vercel.com/v10/projects/{VERCEL_PROJECT_ID}/domains",
        headers={"Authorization": f"Bearer {settings.VERCEL_API_TOKEN}"},
        json={"name": req.domain}
    )
    return {"cname_target": "cname.vercel-dns.com", "status": r.json()}
```

In middleware.ts: detect custom domain, look up org from whitelabel_config.custom_domain.

## Step 5: Plan gate
Only Scale plan orgs see the Branding tab.
Starter/Growth orgs see: "White-label branding requires the Scale plan ($599/mo)."

## Step 6: Powered by footer
For orgs without white-label: render "Powered by Throughput OS" in footer.
For white-label orgs with hide_powered_by=true: render nothing.

## Done When
- Scale org can upload logo, set colors, see branding across all pages
- Custom domain DNS instructions displayed, domain added to Vercel via API
- Starter/Growth see upgrade prompt
- "Powered by" footer conditional on plan
- npx next build passes
