from contextlib import contextmanager

import psycopg
from psycopg.rows import dict_row

from app.config import get_settings


@contextmanager
def get_connection():
    settings = get_settings()
    with psycopg.connect(settings.database_url, row_factory=dict_row) as connection:
        yield connection


def list_sessions() -> list[dict]:
    with get_connection() as connection:
        with connection.cursor() as cursor:
            cursor.execute(
                """
                SELECT id, title, game_name, scheduled_for, status, created_at
                FROM session_hub.sessions
                ORDER BY scheduled_for ASC NULLS LAST, created_at DESC
                """
            )
            return list(cursor.fetchall())


def create_session(title: str, game_name: str, scheduled_for: str | None) -> dict:
    with get_connection() as connection:
        with connection.cursor() as cursor:
            cursor.execute(
                """
                INSERT INTO session_hub.sessions (title, game_name, scheduled_for)
                VALUES (%s, %s, %s)
                RETURNING id, title, game_name, scheduled_for, status, created_at
                """,
                (title, game_name, scheduled_for),
            )
            row = cursor.fetchone()
        connection.commit()
    return row


def health_snapshot() -> dict:
    with get_connection() as connection:
        with connection.cursor() as cursor:
            cursor.execute("SELECT current_database() AS database_name")
            database = cursor.fetchone()
            cursor.execute(
                "SELECT count(*) AS total_sessions FROM session_hub.sessions"
            )
            totals = cursor.fetchone()
    return {
        "database": database["database_name"],
        "schema": "session_hub",
        "sessions": totals["total_sessions"],
    }
