from fastapi import Depends, HTTPException, Header
from typing import Optional
from supabase import create_client
from app.config import get_settings


def get_supabase_client():
    settings = get_settings()
    return create_client(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_KEY)


async def get_user_org_id(
    authorization: Optional[str] = Header(None),
) -> str:
    """Extract org_id from the authenticated user's JWT token via Supabase."""
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing authorization token")

    token = authorization.replace("Bearer ", "")
    settings = get_settings()
    client = create_client(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_KEY)

    # Verify the token and get user
    user_response = client.auth.get_user(token)
    if not user_response or not user_response.user:
        raise HTTPException(status_code=401, detail="Invalid token")

    user_id = user_response.user.id

    # Get the user's organization
    result = client.table("organization_members").select(
        "organization_id"
    ).eq("user_id", user_id).limit(1).execute()

    if not result.data:
        raise HTTPException(status_code=404, detail="No organization found for user")

    return result.data[0]["organization_id"]
