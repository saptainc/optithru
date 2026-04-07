from functools import lru_cache
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    SUPABASE_URL: str
    SUPABASE_KEY: str
    SUPABASE_SERVICE_KEY: str
    FRONTEND_URL: str = "http://localhost:3000"
    ENVIRONMENT: str = "development"
    STRIPE_SECRET_KEY: str = ""
    STRIPE_WEBHOOK_SECRET: str = ""
    APP_URL: str = "http://localhost:3000"
    RESEND_API_KEY: str = ""
    RESEND_FROM_EMAIL: str = "noreply@throughput.ai"
    SHOPIFY_CLIENT_ID: str = ""
    SHOPIFY_CLIENT_SECRET: str = ""
    ANTHROPIC_API_KEY: str = ""
    FIZZY_EMBED_SECRET: str = ""
    KANBAN_INTERNAL_URL: str = "http://kanban-service"
    KANBAN_URL: str = "https://kanban.shankara.sapta.com"
    FIZZY_ACCESS_TOKEN: str = ""
    FIZZY_BOARD_ID: str = ""
    FIZZY_ACCOUNT_SLUG: str = "1"

    model_config = {"env_file": ".env"}

@lru_cache()
def get_settings() -> Settings:
    return Settings()
