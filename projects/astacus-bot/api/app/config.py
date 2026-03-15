from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    app_name: str = "astacus-bot-api"
    app_env: str = "production"
    database_url: str = "postgresql://astacus:astacus@postgres:5432/peg"
    cors_origins: str = "https://professional-evening-gaming.dilger.dev,http://localhost:4173,http://127.0.0.1:4173"

    def cors_origin_list(self) -> list[str]:
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()
