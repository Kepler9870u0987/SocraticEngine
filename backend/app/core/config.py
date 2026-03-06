"""
Application configuration — loaded from environment variables.
"""
from typing import List

from pydantic import field_validator
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Application settings from environment variables."""

    # --- Application ---
    APP_NAME: str = "SocraticEngine"
    APP_ENV: str = "development"
    DEBUG: bool = True
    SECRET_KEY: str = "change-me"
    BACKEND_CORS_ORIGINS: List[str] = ["http://localhost:5173", "http://localhost:3000"]

    # --- Database ---
    DATABASE_URL: str = "postgresql+asyncpg://socratic:socratic_dev_pass@localhost:5432/socratic_engine"
    DATABASE_SYNC_URL: str = "postgresql://socratic:socratic_dev_pass@localhost:5432/socratic_engine"
    DB_ECHO: bool = False

    # --- Redis ---
    REDIS_URL: str = "redis://localhost:6379/0"

    # --- JWT ---
    JWT_SECRET_KEY: str = "change-me"
    JWT_ALGORITHM: str = "HS256"
    JWT_ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    JWT_REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    # --- Anthropic ---
    ANTHROPIC_API_KEY: str = ""
    ANTHROPIC_DEFAULT_MODEL: str = "claude-sonnet-4-20250514"

    # --- OpenAI ---
    OPENAI_API_KEY: str = ""
    OPENAI_DEFAULT_MODEL: str = "gpt-4o-mini"
    OPENAI_HEAVY_MODEL: str = "gpt-4o"

    # --- Google Gemini ---
    GEMINI_API_KEY: str = ""
    GEMINI_FAST_MODEL: str = "gemini-2.0-flash"
    GEMINI_HEAVY_MODEL: str = "gemini-2.5-pro-preview-05-06"

    # --- LLM Routing ---
    # preferred_provider: anthropic | openai | gemini
    LLM_PRIMARY_PROVIDER: str = "anthropic"
    ANTHROPIC_HAIKU_MODEL: str = "claude-haiku-4-20250514"

    # --- Rate Limiting ---
    RATE_LIMIT_PER_MINUTE: int = 100
    RATE_LIMIT_AUTH_PER_MINUTE: int = 10

    # --- Encryption ---
    ENCRYPTION_MASTER_KEY: str = "change-me"

    # --- Logging ---
    LOG_LEVEL: str = "INFO"
    LOG_FORMAT: str = "json"

    @field_validator("BACKEND_CORS_ORIGINS", mode="before")
    @classmethod
    def assemble_cors_origins(cls, v):
        if isinstance(v, str):
            import json
            return json.loads(v)
        return v

    model_config = {
        "env_file": ".env",
        "env_file_encoding": "utf-8",
        "case_sensitive": True,
    }


settings = Settings()
