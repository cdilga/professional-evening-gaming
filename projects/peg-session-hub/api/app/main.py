from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from app.config import get_settings
from app.db import create_session, health_snapshot, list_sessions

settings = get_settings()

app = FastAPI(title="PEG Session Hub", version="0.1.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list(),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class SessionCreate(BaseModel):
    title: str = Field(min_length=2, max_length=120)
    game_name: str = Field(min_length=2, max_length=120)
    scheduled_for: str | None = None


@app.get("/health")
def health() -> dict:
    return {
        "status": "ok",
        "app": settings.app_name,
        "environment": settings.app_env,
        "database": health_snapshot(),
    }


@app.get("/v1/sessions")
def sessions() -> dict:
    return {"items": list_sessions()}


@app.post("/v1/sessions")
def add_session(payload: SessionCreate) -> dict:
    return {
        "item": create_session(
            title=payload.title,
            game_name=payload.game_name,
            scheduled_for=payload.scheduled_for,
        )
    }
