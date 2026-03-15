from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from app.config import get_settings
from app.db import database_health, fetch_recent_notes, insert_note

settings = get_settings()

app = FastAPI(title="Astacus Bot API", version="0.1.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list(),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class NoteCreate(BaseModel):
    author: str = Field(min_length=1, max_length=80)
    body: str = Field(min_length=1, max_length=500)


@app.get("/health")
def health() -> dict:
    return {
        "status": "ok",
        "app": settings.app_name,
        "environment": settings.app_env,
        "database": database_health(),
    }


@app.get("/v1/projects")
def projects() -> dict:
    return {
        "projects": [
            {
                "slug": "astacus-bot",
                "schema": "astacus_bot",
                "api_base": "/v1",
            }
        ]
    }


@app.get("/v1/astacus-bot/notes")
def list_notes() -> dict:
    return {"items": fetch_recent_notes()}


@app.post("/v1/astacus-bot/notes")
def create_note(payload: NoteCreate) -> dict:
    return {"item": insert_note(author=payload.author, body=payload.body)}
