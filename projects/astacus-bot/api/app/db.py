from contextlib import contextmanager

import psycopg
from psycopg.rows import dict_row

from app.config import get_settings


@contextmanager
def get_connection():
    settings = get_settings()
    with psycopg.connect(settings.database_url, row_factory=dict_row) as connection:
        yield connection


def fetch_recent_notes(limit: int = 20) -> list[dict]:
    with get_connection() as connection:
        with connection.cursor() as cursor:
            cursor.execute(
                """
                SELECT id, author, body, created_at
                FROM astacus_bot.notes
                ORDER BY created_at DESC
                LIMIT %s
                """,
                (limit,),
            )
            return list(cursor.fetchall())


def insert_note(author: str, body: str) -> dict:
    with get_connection() as connection:
        with connection.cursor() as cursor:
            cursor.execute(
                """
                INSERT INTO astacus_bot.notes (author, body)
                VALUES (%s, %s)
                RETURNING id, author, body, created_at
                """,
                (author, body),
            )
            row = cursor.fetchone()
        connection.commit()
    return row


def database_health() -> dict:
    with get_connection() as connection:
        with connection.cursor() as cursor:
            cursor.execute("SELECT current_database() AS database_name, current_schema() AS schema_name")
            database = cursor.fetchone()
            cursor.execute(
                """
                SELECT schema_name
                FROM information_schema.schemata
                WHERE schema_name IN ('peg_meta', 'astacus_bot')
                ORDER BY schema_name
                """
            )
            schemas = [row["schema_name"] for row in cursor.fetchall()]
    return {
        "database": database["database_name"],
        "schema": database["schema_name"],
        "schemas": schemas,
    }
