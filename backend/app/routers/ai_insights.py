from fastapi import APIRouter, Query
from pydantic import BaseModel
from supabase import create_client
from app.config import get_settings
from app.services.ai_insights import AIInsightsService

router = APIRouter()


class AskRequest(BaseModel):
    question: str
    org_id: str


@router.get("/insights/weekly")
async def get_weekly_insights(org_id: str = Query()):
    settings = get_settings()
    client = create_client(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_KEY)
    service = AIInsightsService(client, org_id)

    # Try cache first (table may not exist if migration not applied)
    try:
        cached = client.table("ai_insights").select("content").eq(
            "organization_id", org_id
        ).eq("type", "weekly").order("generated_at", desc=True).limit(1).execute()
        if cached.data:
            return cached.data[0]["content"]
    except Exception:
        pass  # Table doesn't exist yet — skip cache

    result = await service.generate_weekly_insights()

    # Try to store in cache
    try:
        client.table("ai_insights").insert({
            "organization_id": org_id,
            "type": "weekly",
            "content": result,
        }).execute()
    except Exception:
        pass  # Table doesn't exist yet — skip caching

    return result


@router.get("/insights/product/{variant_id}")
async def get_product_insight(variant_id: str, org_id: str = Query()):
    settings = get_settings()
    client = create_client(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_KEY)
    service = AIInsightsService(client, org_id)
    return {"insight": await service.generate_product_insight(variant_id)}


@router.post("/insights/ask")
async def ask_question(req: AskRequest):
    settings = get_settings()
    client = create_client(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_KEY)
    service = AIInsightsService(client, req.org_id)
    return {"answer": await service.ask_question(req.question)}
