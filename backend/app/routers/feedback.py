from fastapi import APIRouter
from pydantic import BaseModel
from supabase import create_client
from app.config import get_settings

router = APIRouter()


class FeedbackRequest(BaseModel):
    org_id: str
    user_id: str
    message: str
    page_url: str = ""


@router.post("/feedback")
async def submit_feedback(req: FeedbackRequest):
    settings = get_settings()
    client = create_client(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_KEY)
    client.table("feedback").insert({
        "organization_id": req.org_id,
        "user_id": req.user_id,
        "message": req.message,
        "page_url": req.page_url,
    }).execute()
    return {"status": "submitted"}
