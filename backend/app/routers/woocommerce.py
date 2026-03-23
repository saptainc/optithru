from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from supabase import create_client
from app.config import get_settings
from app.services.woocommerce_sync import WooCommerceSyncService

router = APIRouter()


class WooCommerceSyncRequest(BaseModel):
    store_url: str
    consumer_key: str
    consumer_secret: str
    org_id: str


@router.post("/woocommerce/sync")
async def sync_woocommerce(request: WooCommerceSyncRequest):
    settings = get_settings()
    supabase = create_client(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_KEY)
    service = WooCommerceSyncService(
        store_url=request.store_url,
        consumer_key=request.consumer_key,
        consumer_secret=request.consumer_secret,
        supabase_client=supabase,
        org_id=request.org_id,
    )
    results = {}
    try:
        results["products"] = await service.sync_products()
        results["orders"] = await service.sync_orders()
    except Exception as e:
        raise HTTPException(
            status_code=502, detail=f"WooCommerce sync failed: {str(e)}"
        )
    return {"status": "success", "results": results}
