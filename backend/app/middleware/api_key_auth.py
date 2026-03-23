import hashlib
from fastapi import Request, HTTPException
from supabase import create_client
from app.config import get_settings


async def verify_api_key(request: Request) -> str:
    """Verify API key from Authorization header. Returns org_id."""
    auth = request.headers.get("Authorization", "")
    if not auth.startswith("Bearer tos_"):
        raise HTTPException(status_code=401, detail="Invalid API key format")

    key = auth.replace("Bearer ", "")
    key_hash = hashlib.sha256(key.encode()).hexdigest()

    settings = get_settings()
    client = create_client(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_KEY)

    result = client.table("api_keys").select("organization_id, expires_at").eq("key_hash", key_hash).execute()

    if not result.data:
        raise HTTPException(status_code=401, detail="Invalid API key")

    api_key = result.data[0]

    # Update last_used_at
    client.table("api_keys").update({"last_used_at": "now()"}).eq("key_hash", key_hash).execute()

    return api_key["organization_id"]
