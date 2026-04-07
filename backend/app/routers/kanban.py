import hmac
import hashlib
import base64
import json
import time
import logging

import httpx
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional

from app.config import get_settings
from app.dependencies import get_user_org_id

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/kanban", tags=["kanban"])


def _fizzy_headers():
    settings = get_settings()
    return {"Authorization": f"Bearer {settings.FIZZY_ACCESS_TOKEN}"}


def _fizzy_url(path: str) -> str:
    settings = get_settings()
    return f"{settings.KANBAN_INTERNAL_URL}/{settings.FIZZY_ACCOUNT_SLUG}{path}"


def _generate_embed_token(email: str, name: str, account_name: str, role: str = "admin") -> str:
    settings = get_settings()
    secret = settings.FIZZY_EMBED_SECRET
    if not secret:
        raise HTTPException(status_code=500, detail="FIZZY_EMBED_SECRET not configured")

    header = base64.urlsafe_b64encode(json.dumps({"alg": "HS256"}).encode()).decode().rstrip("=")
    payload = base64.urlsafe_b64encode(json.dumps({
        "email": email,
        "name": name,
        "account_name": account_name,
        "role": role,
        "exp": int(time.time()) + 300,
    }).encode()).decode().rstrip("=")
    sig = hmac.new(secret.encode(), f"{header}.{payload}".encode(), hashlib.sha256).hexdigest()
    return f"{header}.{payload}.{sig}"


@router.post("/session")
async def create_kanban_session(org_id: str = Depends(get_user_org_id)):
    """SSO into Fizzy — returns a transfer URL on the kanban subdomain."""
    from app.dependencies import get_supabase_client

    client = get_supabase_client()
    membership = client.table("organization_members").select(
        "user_id, role, organizations(name)"
    ).eq("organization_id", org_id).limit(1).execute()

    if not membership.data:
        raise HTTPException(status_code=404, detail="Organization not found")

    member = membership.data[0]
    org_name = member.get("organizations", {}).get("name", "OptiThru")
    user_resp = client.auth.admin.get_user_by_id(member["user_id"])
    user = user_resp.user
    email = user.email or "unknown@optithru.com"
    name = user.user_metadata.get("name", email.split("@")[0]) if user.user_metadata else email.split("@")[0]
    fizzy_role = "owner" if member.get("role") == "owner" else "admin"

    token = _generate_embed_token(email, name, org_name, fizzy_role)

    settings = get_settings()
    async with httpx.AsyncClient() as http:
        resp = await http.post(
            f"{settings.KANBAN_INTERNAL_URL}/embed/session",
            json={"embed_token": token},
            timeout=10.0,
        )

    if resp.status_code not in (200, 201):
        raise HTTPException(status_code=502, detail=f"Kanban SSO failed: {resp.text}")

    data = resp.json()
    # Rewrite transfer_url to use the public kanban subdomain
    transfer_url = data.get("transfer_url", "")
    if transfer_url:
        from urllib.parse import urlparse
        parsed = urlparse(transfer_url)
        data["transfer_url"] = f"{settings.KANBAN_URL}{parsed.path}"

    return data


@router.get("/board")
async def get_kanban_board(org_id: str = Depends(get_user_org_id)):
    """Get the TOC kanban board swimlane data."""
    settings = get_settings()
    board_id = settings.FIZZY_BOARD_ID
    if not board_id:
        raise HTTPException(status_code=500, detail="FIZZY_BOARD_ID not configured")

    async with httpx.AsyncClient() as http:
        resp = await http.get(
            _fizzy_url(f"/toc/boards/{board_id}/swimlane.json"),
            headers=_fizzy_headers(),
            timeout=10.0,
        )

    if resp.status_code != 200:
        raise HTTPException(status_code=502, detail=f"Fizzy API error: {resp.status_code}")

    return resp.json()


@router.get("/boards")
async def list_kanban_boards(org_id: str = Depends(get_user_org_id)):
    """List all boards."""
    async with httpx.AsyncClient() as http:
        resp = await http.get(
            _fizzy_url("/boards.json"),
            headers=_fizzy_headers(),
            timeout=10.0,
        )

    if resp.status_code != 200:
        raise HTTPException(status_code=502, detail=f"Fizzy API error: {resp.status_code}")

    return resp.json()


class CreateCardRequest(BaseModel):
    title: str
    column_id: Optional[str] = None


@router.post("/cards")
async def create_card(
    card: CreateCardRequest,
    org_id: str = Depends(get_user_org_id),
):
    """Create a new card on the TOC board. Defaults to Backlog column."""
    settings = get_settings()
    board_id = settings.FIZZY_BOARD_ID

    # If no column specified, get the Backlog column ID
    column_id = card.column_id
    if not column_id:
        async with httpx.AsyncClient() as http:
            board_resp = await http.get(
                _fizzy_url(f"/toc/boards/{board_id}/swimlane.json"),
                headers=_fizzy_headers(),
                timeout=10.0,
            )
            if board_resp.status_code == 200:
                columns = board_resp.json().get("columns", [])
                backlog = next((c for c in columns if c.get("toc_role") == "backlog"), None)
                if backlog:
                    column_id = backlog["id"]

    async with httpx.AsyncClient() as http:
        body = {"card": {"title": card.title}}
        if column_id:
            body["card"]["column_id"] = column_id
        resp = await http.post(
            _fizzy_url(f"/boards/{board_id}/cards.json"),
            headers=_fizzy_headers(),
            json=body,
            timeout=10.0,
        )

    if resp.status_code not in (200, 201):
        raise HTTPException(status_code=502, detail=f"Failed to create card: {resp.text}")

    return resp.json()


class MoveCardRequest(BaseModel):
    card_id: str
    column_id: str


@router.post("/cards/move")
async def move_card(
    req: MoveCardRequest,
    org_id: str = Depends(get_user_org_id),
):
    """Move a card to a different column."""
    async with httpx.AsyncClient() as http:
        resp = await http.post(
            _fizzy_url(f"/cards/{req.card_id}/triage.json"),
            headers=_fizzy_headers(),
            json={"column_id": req.column_id},
            timeout=10.0,
        )

    if resp.status_code not in (200, 201, 204):
        raise HTTPException(status_code=502, detail=f"Failed to move card: {resp.text}")

    return {"ok": True}


class TocAction(BaseModel):
    title: str
    toc_step: str
    target_metric: str
    linked_entity_type: str
    linked_entity_id: str
    linked_entity_name: str


@router.post("/toc/actions")
async def create_toc_action(
    action: TocAction,
    org_id: str = Depends(get_user_org_id),
):
    """Create a TOC action card via the Fizzy TOC API."""
    settings = get_settings()
    board_id = settings.FIZZY_BOARD_ID

    async with httpx.AsyncClient() as http:
        resp = await http.post(
            _fizzy_url("/toc/actions.json"),
            headers=_fizzy_headers(),
            json={
                "board_id": board_id,
                "action": {
                    "title": action.title,
                    "toc_step": action.toc_step,
                    "target_metric": action.target_metric,
                    "linked_entity": {
                        "type": action.linked_entity_type,
                        "id": action.linked_entity_id,
                        "name": action.linked_entity_name,
                    },
                },
            },
            timeout=10.0,
        )

    if resp.status_code not in (200, 201):
        raise HTTPException(status_code=502, detail=f"Failed to create TOC card: {resp.text}")

    return resp.json()


@router.get("/toc/drawer")
async def get_toc_drawer(org_id: str = Depends(get_user_org_id)):
    """Get current user's active focus tasks."""
    async with httpx.AsyncClient() as http:
        resp = await http.get(
            _fizzy_url("/toc/drawer.json"),
            headers=_fizzy_headers(),
            timeout=10.0,
        )

    if resp.status_code != 200:
        return {"my_active_cards": [], "total_active": 0}

    return resp.json()
