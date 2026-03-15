from pathlib import Path

import psycopg

from app.config import get_settings


def ensure_tracking_table(connection: psycopg.Connection) -> None:
    with connection.cursor() as cursor:
        cursor.execute("CREATE SCHEMA IF NOT EXISTS peg_meta")
        cursor.execute(
            """
            CREATE TABLE IF NOT EXISTS peg_meta.schema_migrations (
                project_name TEXT NOT NULL,
                filename TEXT NOT NULL,
                applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                PRIMARY KEY (project_name, filename)
            )
            """
        )
    connection.commit()


def applied_migrations(connection: psycopg.Connection) -> set[str]:
    with connection.cursor() as cursor:
        cursor.execute(
            "SELECT filename FROM peg_meta.schema_migrations WHERE project_name = %s ORDER BY filename",
            ("astacus-bot",),
        )
        return {row[0] for row in cursor.fetchall()}


def apply_migration(connection: psycopg.Connection, migration_path: Path) -> None:
    sql = migration_path.read_text(encoding="utf-8")
    with connection.cursor() as cursor:
        cursor.execute(sql)
        cursor.execute(
            "INSERT INTO peg_meta.schema_migrations (project_name, filename) VALUES (%s, %s)",
            ("astacus-bot", migration_path.name),
        )
    connection.commit()


def main() -> None:
    settings = get_settings()
    migrations_dir = Path(__file__).resolve().parents[1] / "migrations"
    with psycopg.connect(settings.database_url) as connection:
        ensure_tracking_table(connection)
        applied = applied_migrations(connection)

        for migration_path in sorted(migrations_dir.glob("*.sql")):
            if migration_path.name in applied:
                continue
            apply_migration(connection, migration_path)
            print(f"Applied migration {migration_path.name}")


if __name__ == "__main__":
    main()
