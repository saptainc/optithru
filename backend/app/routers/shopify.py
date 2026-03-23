from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from supabase import create_client
from app.config import get_settings
from app.services.shopify_sync import ShopifySyncService

router = APIRouter()


class ShopifySyncRequest(BaseModel):
    shop_domain: str
    access_token: str
    org_id: str
    sync_type: str = "all"  # "products", "orders", or "all"


@router.post("/shopify/sync")
async def sync_shopify(request: ShopifySyncRequest):
    """Trigger a Shopify sync for products and/or orders."""
    settings = get_settings()
    supabase = create_client(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_KEY)

    service = ShopifySyncService(
        shop_domain=request.shop_domain,
        access_token=request.access_token,
        supabase_client=supabase,
        org_id=request.org_id,
    )

    results = {}
    try:
        if request.sync_type in ("products", "all"):
            results["products"] = await service.sync_products()
        if request.sync_type in ("orders", "all"):
            results["orders"] = await service.sync_orders()
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Shopify sync failed: {str(e)}")

    return {"status": "success", "results": results}
