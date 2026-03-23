from fastapi import APIRouter
from app.config import get_settings
from supabase import create_client
from datetime import datetime, timezone

router = APIRouter()


@router.get("/healthz")
@router.get("/api/v1/healthz")
@router.get("/health")
async def health_check():
    settings = get_settings()
    db_ok = False
    try:
        client = create_client(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_KEY)
        result = client.table("organizations").select("id").limit(1).execute()
        db_ok = True
    except Exception:
        pass

    return {
        "status": "ok" if db_ok else "degraded",
        "db": "connected" if db_ok else "disconnected",
        "version": "1.0.0",
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }
