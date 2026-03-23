"""Background job scheduler for periodic tasks."""

from apscheduler.schedulers.asyncio import AsyncIOScheduler
from app.core.logging import get_logger

logger = get_logger("scheduler")
scheduler = AsyncIOScheduler()


async def shopify_auto_sync():
    """Run scheduled Shopify sync for all connected organizations."""
    logger.info("shopify_auto_sync_triggered")
    # In production, this would iterate through orgs with Shopify connections
    # and run ShopifySyncService for each
    pass


def start_scheduler():
    scheduler.add_job(shopify_auto_sync, "interval", hours=6, id="shopify_sync")
    scheduler.start()
    logger.info("scheduler_started", jobs=len(scheduler.get_jobs()))
