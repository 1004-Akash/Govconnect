import os
from typing import Optional
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    mongodb_uri: str = "mongodb+srv://ajey12c3001:NoufmpJk0GG99kR4@governmentai.dgxynkw.mongodb.net/"
    mongodb_db: str = "GovernmentAI"
    openrouter_api_key: str = "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"
    openrouter_base_url: str = "https://openrouter.ai/api/v1"
    rules_model: str = "gpt-3.5-turbo"
    pdf_cache_ttl_hours: int = 720
    max_pdf_pages: int = 200

    # Accept extra env vars so other app configs in the shared .env don't break GovMatch
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")


settings = Settings()
