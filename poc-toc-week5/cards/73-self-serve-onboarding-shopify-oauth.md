# Card #73: Build self-serve onboarding flow with Shopify OAuth and automated email drip

**Fizzy URL**: https://fizzy.sapta.com/1/cards/73  
**Time Estimate**: 7 hours

---

## Goal
Zero-touch onboarding: new DTC brand signs up, connects Shopify via OAuth, reaches first aha moment in < 15 minutes. Shankara required 6 hours of manual prep. Week 5 makes it automated.

## Step 1: Migration 19
File: `supabase/migrations/19-onboarding.sql`
```sql
CREATE TABLE IF NOT EXISTS public.onboarding_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) UNIQUE,
  step text NOT NULL DEFAULT 'signup',
  completed_steps text[] NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
-- Steps: signup -> connect_store -> first_sync -> view_dashboard -> complete
ALTER TABLE public.onboarding_progress ENABLE ROW LEVEL SECURITY;
```

## Step 2: Onboarding checklist UI
File: `src/app/onboarding/page.tsx`

4-step guided checklist:
1. Connect your Shopify store (OAuth button or manual API key fallback)
2. Sync products and orders (auto-triggered, shows spinner)
3. Set your constraint ("Usually your ad budget or production capacity")
4. View your first T/CU ranking

Each step marks complete in onboarding_progress. Show progress bar.

## Step 3: Shopify OAuth flow
File: `backend/app/routers/shopify_oauth.py`

```python
@router.get("/api/v1/shopify/install")
async def shopify_install(shop: str):
    # Redirect -> https://{shop}/admin/oauth/authorize
    # ?client_id=SHOPIFY_CLIENT_ID
    # &scope=read_products,read_orders
    # &redirect_uri={APP_URL}/api/v1/shopify/callback
    # &state={hmac_nonce}
    return RedirectResponse(build_oauth_url(shop))

@router.get("/api/v1/shopify/callback")
async def shopify_callback(code: str, shop: str, state: str,
                            user=Depends(get_current_user), supabase=Depends(get_supabase)):
    verify_hmac(state)
    token = await exchange_code(shop, code)
    # Store in shopify_connections, trigger sync, redirect to /onboarding?step=syncing
    return RedirectResponse("/onboarding?syncing=true")
```

Env vars needed: SHOPIFY_CLIENT_ID, SHOPIFY_CLIENT_SECRET

## Step 4: 3-email onboarding drip (Resend)
Triggered after first sync completes:

Email 1 (immediate): Subject "Your data is ready"
- Shows top 3 T/CU products from their store

Email 2 (day +2): Subject "Your hidden constraint"
- Identifies their binding resource + recommended action

Email 3 (day +5): Subject "One change to add rupees this month"
- Top AI recommendation from Claude

Use APScheduler delayed jobs or a drip_queue table.

## Step 5: Middleware redirect for new orgs
In middleware.ts, after auth check, redirect incomplete orgs to /onboarding:
```typescript
const progress = await getOnboardingProgress(supabase, orgId)
if (!progress || progress.step !== "complete") {
  if (!request.nextUrl.pathname.startsWith("/onboarding")) {
    return NextResponse.redirect(new URL("/onboarding", request.url))
  }
}
```

## Step 6: Second customer target
Use Shankara referral or Systematrix network. Send self-serve signup link.
Success criteria: new org completes /onboarding without any manual help.

## Done When
- New org can sign up -> /onboarding -> OAuth -> sync -> /dashboard, zero manual intervention
- Shopify OAuth flow works end-to-end (HMAC verified, token stored, sync triggered)
- Onboarding checklist UI tracks progress through all 4 steps
- 3-email drip triggers after first sync
- At least 1 new customer completes self-serve onboarding
