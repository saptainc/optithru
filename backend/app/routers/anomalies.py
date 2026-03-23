from fastapi import APIRouter, Query
from supabase import create_client

from app.config import get_settings
from app.services.anomaly_detector import AnomalyDetector

router = APIRouter()


@router.post("/anomalies/run")
async def run_anomaly_checks(org_id: str = Query()):
    """Trigger anomaly detection for an organization."""
    settings = get_settings()
    supabase = create_client(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_KEY)
    detector = AnomalyDetector(supabase, org_id)
    anomalies = await detector.run_checks()
    return {"status": "success", "anomalies_found": len(anomalies), "anomalies": anomalies}


@router.get("/anomalies")
async def list_anomalies(org_id: str = Query(), resolved: bool = False):
    """List anomalies for an organization."""
    settings = get_settings()
    supabase = create_client(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_KEY)
    query = (
        supabase.table("anomalies")
        .select("*")
        .eq("organization_id", org_id)
        .order("created_at", desc=True)
        .limit(50)
    )
    if not resolved:
        query = query.is_("resolved_at", "null")
    result = query.execute()
    return {"anomalies": result.data or []}


@router.post("/anomalies/{anomaly_id}/resolve")
async def resolve_anomaly(anomaly_id: str):
    """Mark an anomaly as resolved."""
    settings = get_settings()
    supabase = create_client(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_KEY)
    from datetime import datetime, timezone

    supabase.table("anomalies").update(
        {"resolved_at": datetime.now(timezone.utc).isoformat()}
    ).eq("id", anomaly_id).execute()
    return {"status": "resolved"}
