from fastapi import APIRouter

router = APIRouter()


@router.get("/healthz")
@router.get("/api/v1/healthz")
async def health_check():
    return {"status": "ok", "version": "0.1.0"}
