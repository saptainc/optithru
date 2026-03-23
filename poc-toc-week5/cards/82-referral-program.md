# Card #82: Build referral program with automated reward credits and WhatsApp sharing

**Fizzy URL**: https://fizzy.sapta.com/1/cards/82  
**Time Estimate**: 4 hours

---

## Goal
Turn Shankara into an active promoter. Indian business networks are relationship-driven - one warm referral is worth 100 cold outreaches.

## Step 1: Migration 25
File: `supabase/migrations/25-referrals.sql`
```sql
CREATE TABLE IF NOT EXISTS public.referrals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_org_id uuid NOT NULL REFERENCES public.organizations(id),
  referrer_user_id uuid NOT NULL REFERENCES auth.users(id),
  referral_code text NOT NULL UNIQUE DEFAULT upper(substring(gen_random_uuid()::text, 1, 8)),
  referee_email text,
  referee_org_id uuid REFERENCES public.organizations(id),
  status text NOT NULL DEFAULT 'pending',
  reward_credited_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;
```

## Step 2: Refer and Earn Settings section
File: `src/app/dashboard/settings/referral/page.tsx`

```typescript
const referral = await getOrgReferral(supabase, orgId)
const shareUrl = `https://throughput.ai?ref=${referral.referral_code}`
const whatsappText = encodeURIComponent(
  `I have been using Throughput OS to find which products actually drive profit using Theory of Constraints. ` +
  `Eye-opening for our brand. Check it out: ${shareUrl}`
)
```

Display:
- Large referral code with copy button
- WhatsApp share button -> https://wa.me/?text=${whatsappText}
- Stats: pending / signed_up / converted counts

## Step 3: Attribution on signup
Read ?ref=CODE from URL. Store in sessionStorage during auth flow.
After org created, call POST /api/v1/referrals/attribute:
```python
@router.post("/api/v1/referrals/attribute")
async def attribute(req: AttributeRequest):
    supabase.from_("referrals").update({
        "referee_org_id": req.org_id,
        "referee_email": req.email,
        "status": "signed_up"
    }).eq("referral_code", req.code).execute()
```

## Step 4: Conversion reward
In Stripe checkout.session.completed webhook:
```python
referral = supabase.from_("referrals").select("*")     .eq("referee_org_id", org_id).eq("status", "signed_up").single().execute()

if referral.data:
    # Extend referrer subscription by 30 days via Stripe API
    stripe.Subscription.modify(
        referrer_sub_id,
        trial_end=referrer_current_period_end + 30*86400
    )
    # Update status
    supabase.from_("referrals").update({
        "status": "converted",
        "reward_credited_at": datetime.utcnow().isoformat()
    }).eq("id", referral.data["id"]).execute()
    # Send "You earned a free month!" email
    await email_service.send_referral_reward(referrer_email)
```

## Step 5: Launch email to Shankara
Draft and send manually:
Subject: "You have unlocked Refer and Earn - share Throughput OS with your network"
Body: Personal note from Hari + their referral code + WhatsApp template + specific peer founders to reach.

## Done When
- Referral code auto-generated for each org in Settings
- ?ref=CODE on signup attributes correctly in DB
- Conversion credits referrer with 1 free month via Stripe
- Referrer receives "You earned a free month!" Resend email
- Shankara launch email sent with their personal code
