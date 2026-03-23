from fastapi import APIRouter, Request, HTTPException
from pydantic import BaseModel
from app.config import get_settings
import stripe
from supabase import create_client

router = APIRouter()

PLAN_PRICES = {
    "starter": {"name": "Starter", "price": 9900, "features": ["1 Shopify store", "Up to 100 SKUs", "Email support"]},
    "growth": {"name": "Growth", "price": 24900, "features": ["3 stores", "Unlimited SKUs", "Priority support", "API access"]},
    "scale": {"name": "Scale", "price": 59900, "features": ["Unlimited stores", "White-label", "API access", "Dedicated CSM"]},
}


class CheckoutRequest(BaseModel):
    plan: str
    org_id: str


@router.post("/billing/checkout")
async def create_checkout(req: CheckoutRequest):
    """Create a Stripe Checkout session."""
    settings = get_settings()
    if not settings.STRIPE_SECRET_KEY or settings.STRIPE_SECRET_KEY == "sk_test_placeholder":
        # Return mock response for development
        return {"url": f"{settings.APP_URL}/dashboard/settings?billing=mock&plan={req.plan}"}

    stripe.api_key = settings.STRIPE_SECRET_KEY

    plan = PLAN_PRICES.get(req.plan)
    if not plan:
        raise HTTPException(status_code=400, detail=f"Invalid plan: {req.plan}")

    session = stripe.checkout.Session.create(
        mode="subscription",
        line_items=[{
            "price_data": {
                "currency": "usd",
                "product_data": {"name": f"Throughput OS — {plan['name']}"},
                "unit_amount": plan["price"],
                "recurring": {"interval": "month"},
            },
            "quantity": 1,
        }],
        success_url=f"{settings.APP_URL}/dashboard/settings?billing=success",
        cancel_url=f"{settings.APP_URL}/pricing?billing=cancelled",
        metadata={"org_id": req.org_id, "plan": req.plan},
    )

    return {"url": session.url}


@router.get("/billing/plans")
async def get_plans():
    """Return available billing plans."""
    return PLAN_PRICES


@router.post("/billing/webhook")
async def stripe_webhook(request: Request):
    """Handle Stripe webhook events."""
    settings = get_settings()
    if not settings.STRIPE_SECRET_KEY or settings.STRIPE_SECRET_KEY == "sk_test_placeholder":
        return {"status": "skipped"}

    stripe.api_key = settings.STRIPE_SECRET_KEY
    payload = await request.body()
    sig = request.headers.get("stripe-signature", "")

    try:
        event = stripe.Webhook.construct_event(payload, sig, settings.STRIPE_WEBHOOK_SECRET)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid webhook signature")

    supabase = create_client(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_KEY)

    if event["type"] == "checkout.session.completed":
        session = event["data"]["object"]
        org_id = session["metadata"]["org_id"]
        plan = session["metadata"]["plan"]

        supabase.table("subscriptions").upsert({
            "organization_id": org_id,
            "stripe_customer_id": session.get("customer"),
            "stripe_subscription_id": session.get("subscription"),
            "plan": plan,
            "status": "active",
        }, on_conflict="organization_id").execute()

    elif event["type"] in ("customer.subscription.updated", "customer.subscription.deleted"):
        sub = event["data"]["object"]
        status = "active" if sub["status"] == "active" else "cancelled" if sub["status"] == "canceled" else sub["status"]

        supabase.table("subscriptions").update({
            "status": status,
            "current_period_end": sub.get("current_period_end"),
        }).eq("stripe_subscription_id", sub["id"]).execute()

    return {"status": "ok"}
