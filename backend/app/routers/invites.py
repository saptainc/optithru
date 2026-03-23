from fastapi import APIRouter, HTTPException, Depends, Header
from pydantic import BaseModel
from typing import Optional
from supabase import create_client
from app.config import get_settings
from app.dependencies import get_user_org_id

router = APIRouter()


class InviteRequest(BaseModel):
    email: str
    role: str = "member"
    org_id: str


class AcceptInviteRequest(BaseModel):
    token: str


def _get_service_client():
    settings = get_settings()
    return create_client(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_KEY)


def _get_user_id_from_token(authorization: Optional[str]) -> Optional[str]:
    if not authorization or not authorization.startswith("Bearer "):
        return None
    token = authorization.replace("Bearer ", "")
    client = _get_service_client()
    user_response = client.auth.get_user(token)
    if not user_response or not user_response.user:
        return None
    return user_response.user.id


@router.post("/invites")
async def create_invite(
    request: InviteRequest,
    authorization: Optional[str] = Header(None),
):
    """Create an organization invite. Caller must be owner/admin of the org."""
    user_id = _get_user_id_from_token(authorization)
    if not user_id:
        raise HTTPException(status_code=401, detail="Authentication required")

    client = _get_service_client()

    # Verify caller is owner/admin of the org
    membership = (
        client.table("organization_members")
        .select("role")
        .eq("user_id", user_id)
        .eq("organization_id", request.org_id)
        .limit(1)
        .execute()
    )
    if not membership.data or membership.data[0]["role"] not in ("owner", "admin"):
        raise HTTPException(status_code=403, detail="Only org owners/admins can send invites")

    # Check for existing pending invite
    existing = (
        client.table("organization_invites")
        .select("id")
        .eq("organization_id", request.org_id)
        .eq("email", request.email)
        .is_("accepted_at", "null")
        .execute()
    )
    if existing.data:
        raise HTTPException(status_code=409, detail="Pending invite already exists for this email")

    # Insert invite
    result = (
        client.table("organization_invites")
        .insert({
            "organization_id": request.org_id,
            "email": request.email,
            "role": request.role,
            "invited_by": user_id,
        })
        .execute()
    )

    if not result.data:
        raise HTTPException(status_code=500, detail="Failed to create invite")

    invite = result.data[0]
    return {
        "status": "success",
        "token": invite["token"],
        "invite_id": invite["id"],
        "email": invite["email"],
        "expires_at": invite["expires_at"],
    }


@router.get("/invites")
async def list_invites(
    org_id: str,
    authorization: Optional[str] = Header(None),
):
    """List pending invites for an organization."""
    user_id = _get_user_id_from_token(authorization)
    if not user_id:
        raise HTTPException(status_code=401, detail="Authentication required")

    client = _get_service_client()

    # Verify caller is member of the org
    membership = (
        client.table("organization_members")
        .select("role")
        .eq("user_id", user_id)
        .eq("organization_id", org_id)
        .limit(1)
        .execute()
    )
    if not membership.data:
        raise HTTPException(status_code=403, detail="Not a member of this organization")

    result = (
        client.table("organization_invites")
        .select("id, email, role, token, invited_by, accepted_at, expires_at, created_at")
        .eq("organization_id", org_id)
        .order("created_at", desc=True)
        .execute()
    )

    return {"invites": result.data or []}


@router.post("/invites/accept")
async def accept_invite(
    request: AcceptInviteRequest,
    authorization: Optional[str] = Header(None),
):
    """Accept an invite by token. User must be authenticated."""
    user_id = _get_user_id_from_token(authorization)
    if not user_id:
        raise HTTPException(status_code=401, detail="Authentication required")

    client = _get_service_client()

    # Look up invite by token
    result = (
        client.table("organization_invites")
        .select("*")
        .eq("token", request.token)
        .limit(1)
        .execute()
    )

    if not result.data:
        raise HTTPException(status_code=404, detail="Invite not found")

    invite = result.data[0]

    if invite["accepted_at"] is not None:
        raise HTTPException(status_code=400, detail="Invite already accepted")

    # Check expiry
    from datetime import datetime, timezone
    expires_at = datetime.fromisoformat(invite["expires_at"].replace("Z", "+00:00"))
    if expires_at < datetime.now(timezone.utc):
        raise HTTPException(status_code=410, detail="Invite has expired")

    # Check if user is already a member
    existing_member = (
        client.table("organization_members")
        .select("id")
        .eq("user_id", user_id)
        .eq("organization_id", invite["organization_id"])
        .limit(1)
        .execute()
    )
    if existing_member.data:
        # Already a member, just mark invite accepted
        client.table("organization_invites").update(
            {"accepted_at": datetime.now(timezone.utc).isoformat()}
        ).eq("id", invite["id"]).execute()
        return {"status": "success", "message": "Already a member of this organization"}

    # Insert into organization_members
    client.table("organization_members").insert({
        "user_id": user_id,
        "organization_id": invite["organization_id"],
        "role": invite["role"],
    }).execute()

    # Mark invite as accepted
    client.table("organization_invites").update(
        {"accepted_at": datetime.now(timezone.utc).isoformat()}
    ).eq("id", invite["id"]).execute()

    return {"status": "success", "message": "Invite accepted", "organization_id": invite["organization_id"]}
