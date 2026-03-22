from functools import lru_cache
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    SUPABASE_URL: str
    SUPABASE_KEY: str
    SUPABASE_SERVICE_KEY: str
    FRONTEND_URL: str = "http://localhost:3000"
    ENVIRONMENT: str = "development"

    model_config = {"env_file": ".env"}

@lru_cache()
def get_settings() -> Settings:
    return Settings()
