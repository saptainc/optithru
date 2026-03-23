from fastapi import APIRouter, UploadFile, File, Query, HTTPException
from pydantic import BaseModel
from supabase import create_client

from app.config import get_settings
from app.services.amazon_sync import AmazonSyncService
from app.services.meesho_sync import MeeshoCSVParser

router = APIRouter()


class AmazonSyncRequest(BaseModel):
    seller_id: str
    access_token: str
    org_id: str


@router.post("/amazon/sync")
async def sync_amazon(req: AmazonSyncRequest):
    settings = get_settings()
    supabase = create_client(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_KEY)
    service = AmazonSyncService(
        req.seller_id,
        req.access_token,
        supabase_client=supabase,
        org_id=req.org_id,
    )
    products = await service.sync_catalog()
    orders = await service.sync_orders()
    return {"status": "success", "products": products, "orders": orders}


@router.post("/meesho/import")
async def import_meesho(
    org_id: str = Query(),
    file: UploadFile = File(...),
):
    settings = get_settings()
    supabase = create_client(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_KEY)
    content = (await file.read()).decode("utf-8")
    parser = MeeshoCSVParser(supabase, org_id)
    result = await parser.parse_and_import(content)
    return {"status": "success", "results": result}
