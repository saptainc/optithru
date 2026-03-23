# Card #74: Add PostHog product analytics, internal admin dashboard, and feature flags

**Fizzy URL**: https://fizzy.sapta.com/1/cards/74  
**Time Estimate**: 5 hours

---

## Goal
Track how customers actually use the product, identify drop-off, measure feature adoption, control rollout with flags.

## Step 1: Frontend PostHog
```bash
cd ~/throughput-os/frontend && npm install posthog-js
```

File: `src/lib/posthog.ts`
```typescript
import posthog from "posthog-js"

export function initPostHog() {
  if (typeof window === "undefined") return
  posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY!, {
    api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://app.posthog.com",
    capture_pageview: false,
  })
}

export const track = (event: string, props?: Record<string, unknown>) =>
  posthog.capture(event, props)
```

Track these events throughout the app:
- page_view (all routes in layout useEffect)
- feature_used: { feature: "what_if_simulator" | "pdf_export" | "ai_insights" | "product_detail" }
- shopify_sync_triggered
- what_if_scenario_run: { scenario_type, delta_t }
- pdf_exported
- ai_insight_generated
- onboarding_step_completed: { step }

## Step 2: Backend PostHog
```bash
cd ~/throughput-os/backend && uv add posthog
```

Track server-side (fire-and-forget):
- org_created
- shopify_sync_completed: { products_synced, orders_synced }
- stripe_subscription_started: { plan }
- api_key_created
- weekly_digest_sent

## Step 3: Admin dashboard
File: `src/app/admin/page.tsx`

Guard: accessible only to hari@1in3in5.org (check in server component).

Sections:
1. Org overview: name, plan, last login, products synced, onboarding status
2. Feature adoption: % of orgs using What-If, AI Insights, PDF export, API keys
3. Revenue: MRR + subscription count (from Stripe API)
4. Sync health: last sync time per org + any failures
5. AI usage: tokens this week + estimated cost

## Step 4: Revenue endpoint
```python
@router.get("/admin/api/revenue")
async def get_revenue(user=Depends(require_admin)):
    subs = stripe.Subscription.list(status="active", limit=100)
    mrr = sum(s.plan.amount for s in subs.data) / 100  # cents to dollars
    return {"mrr_usd": mrr, "count": len(subs.data)}
```

## Step 5: Feature flags
Create these flags in PostHog dashboard:
- ai_insights_enabled
- shopify_oauth_enabled
- self_serve_onboarding_enabled
- white_label_enabled

Check in frontend:
```typescript
const aiEnabled = posthog.isFeatureEnabled("ai_insights_enabled")
```

Initially enable only for Shankara org, then roll out.

## Done When
- PostHog capturing events in production (verify in PostHog dashboard)
- Admin page shows all active orgs with plan + usage
- MRR visible in admin
- Feature flags controlling Week 5 rollout
- uv run pytest -v passes
