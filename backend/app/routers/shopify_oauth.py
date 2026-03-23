from fastapi import APIRouter, Query
from fastapi.responses import RedirectResponse
from app.config import get_settings
import secrets

router = APIRouter()


@router.get("/shopify/install")
async def shopify_install(shop: str = Query(), org_id: str = Query()):
    """Redirect to Shopify OAuth consent screen."""
    settings = get_settings()
    client_id = settings.SHOPIFY_CLIENT_ID
    if not client_id:
        # Dev mode: redirect back with mock token
        return RedirectResponse(
            f"{settings.APP_URL}/onboarding?step=first_sync&shop={shop}&mock=true"
        )

    nonce = secrets.token_hex(16)
    scopes = "read_products,read_orders,read_inventory"
    redirect_uri = f"{settings.APP_URL}/api/v1/shopify/callback"
    install_url = (
        f"https://{shop}/admin/oauth/authorize"
        f"?client_id={client_id}&scope={scopes}"
        f"&redirect_uri={redirect_uri}&state={org_id}:{nonce}"
    )
    return RedirectResponse(install_url)


@router.get("/shopify/callback")
async def shopify_callback(
    code: str = Query(), shop: str = Query(), state: str = Query()
):
    """Exchange code for permanent access token."""
    import httpx

    settings = get_settings()
    client_id = settings.SHOPIFY_CLIENT_ID
    client_secret = settings.SHOPIFY_CLIENT_SECRET
    org_id = state.split(":")[0]

    if not client_id:
        return RedirectResponse(f"{settings.APP_URL}/onboarding?step=first_sync")

    async with httpx.AsyncClient() as client:
        resp = await client.post(
            f"https://{shop}/admin/oauth/access_token",
            json={
                "client_id": client_id,
                "client_secret": client_secret,
                "code": code,
            },
        )
        data = resp.json()
        access_token = data.get("access_token")

    # Store in Supabase
    from supabase import create_client as create_supabase_client

    supabase = create_supabase_client(
        settings.SUPABASE_URL, settings.SUPABASE_SERVICE_KEY
    )
    supabase.table("shopify_connections").upsert(
        {
            "organization_id": org_id,
            "shop_domain": shop,
            "access_token": access_token,
        },
        on_conflict="organization_id",
    ).execute()

    # Update onboarding progress
    supabase.table("onboarding_progress").upsert(
        {
            "organization_id": org_id,
            "step": "first_sync",
            "completed_steps": ["signup", "connect_store"],
        },
        on_conflict="organization_id",
    ).execute()

    return RedirectResponse(f"{settings.APP_URL}/onboarding?step=first_sync")
