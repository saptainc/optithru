import hashlib
import secrets

from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel
from supabase import create_client
from app.middleware.api_key_auth import verify_api_key
from app.config import get_settings

router = APIRouter()


class CreateKeyRequest(BaseModel):
    name: str
    org_id: str


@router.get("/public/kpis")
async def get_public_kpis(org_id: str = Depends(verify_api_key)):
    settings = get_settings()
    client = create_client(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_KEY)

    # Try RPC first
    result = client.rpc("fn_system_kpis", {"p_org_id": org_id}).execute()
    if result.data:
        return {"data": result.data[0]}
    return {"data": {}}


@router.get("/public/products")
async def get_public_products(
    org_id: str = Depends(verify_api_key),
    limit: int = Query(default=50, le=200),
    offset: int = Query(default=0, ge=0),
):
    settings = get_settings()
    client = create_client(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_KEY)

    result = (
        client.from_("v_product_throughput")
        .select(
            "variant_id, product_name, category, price, cogs, throughput_per_unit, throughput_margin_pct, inventory_quantity"
        )
        .eq("organization_id", org_id)
        .order("throughput_per_unit", desc=True)
        .range(offset, offset + limit - 1)
        .execute()
    )

    return {"data": result.data or [], "meta": {"limit": limit, "offset": offset}}


@router.get("/public/rankings")
async def get_public_rankings(
    org_id: str = Depends(verify_api_key),
    constraint_id: str = Query(default=None),
):
    settings = get_settings()
    client = create_client(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_KEY)

    if constraint_id:
        result = client.rpc(
            "fn_tcu_rankings",
            {"p_org_id": org_id, "p_constraint_id": constraint_id},
        ).execute()
        return {"data": result.data or []}

    # Default: rank by throughput_per_unit
    result = (
        client.from_("v_product_throughput")
        .select("*")
        .eq("organization_id", org_id)
        .order("throughput_per_unit", desc=True)
        .execute()
    )
    return {"data": result.data or []}


@router.get("/public/snapshots")
async def get_public_snapshots(
    org_id: str = Depends(verify_api_key),
    days: int = Query(default=30, le=365),
):
    settings = get_settings()
    client = create_client(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_KEY)

    result = (
        client.from_("toc_snapshots")
        .select("*")
        .eq("organization_id", org_id)
        .order("snapshot_date", desc=False)
        .execute()
    )
    return {"data": result.data or []}


@router.post("/public/snapshots")
async def trigger_snapshot(org_id: str = Depends(verify_api_key)):
    settings = get_settings()
    client = create_client(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_KEY)

    result = client.rpc("fn_capture_snapshot", {"p_org_id": org_id}).execute()
    return {"data": result.data, "status": "captured"}


@router.post("/keys")
async def create_api_key(request: CreateKeyRequest):
    """Create a new API key. Returns the full key ONCE."""
    raw_key = f"tos_live_{secrets.token_hex(24)}"
    key_hash = hashlib.sha256(raw_key.encode()).hexdigest()
    key_prefix = raw_key[:16]

    settings = get_settings()
    client = create_client(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_KEY)

    client.table("api_keys").insert(
        {
            "organization_id": request.org_id,
            "name": request.name,
            "key_hash": key_hash,
            "key_prefix": key_prefix,
        }
    ).execute()

    return {"key": raw_key, "prefix": key_prefix, "name": request.name}
