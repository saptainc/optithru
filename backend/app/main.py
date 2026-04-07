from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

from app.config import get_settings
from app.routers import health, calculations, shopify, reports, invites, billing, public_api, woocommerce, feedback, ai_insights, shopify_oauth, marketplace, anomalies, kanban

settings = get_settings()

limiter = Limiter(key_func=get_remote_address)


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    from app.core.logging import setup_logging
    from app.core.scheduler import start_scheduler

    setup_logging()
    start_scheduler()
    yield
    # Shutdown


app = FastAPI(title="Throughput OS API", version="1.0.0", lifespan=lifespan)

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.FRONTEND_URL],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health.router)
app.include_router(calculations.router, prefix="/api/v1")
app.include_router(shopify.router, prefix="/api/v1")
app.include_router(reports.router, prefix="/api/v1")
app.include_router(invites.router, prefix="/api/v1")
app.include_router(billing.router, prefix="/api/v1")
app.include_router(public_api.router, prefix="/api/v1")
app.include_router(woocommerce.router, prefix="/api/v1")
app.include_router(feedback.router, prefix="/api/v1")
app.include_router(ai_insights.router, prefix="/api/v1")
app.include_router(shopify_oauth.router, prefix="/api/v1")
app.include_router(marketplace.router, prefix="/api/v1")
app.include_router(anomalies.router, prefix="/api/v1")
app.include_router(kanban.router, prefix="/api/v1")
