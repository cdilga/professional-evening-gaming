from importlib.util import module_from_spec, spec_from_file_location
from pathlib import Path
import sys

from fastapi.testclient import TestClient


ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))
spec = spec_from_file_location("astacus_main", ROOT / "app" / "main.py")
main_module = module_from_spec(spec)
assert spec and spec.loader
spec.loader.exec_module(main_module)

client = TestClient(main_module.app)


def test_health_uses_database_snapshot(monkeypatch):
    monkeypatch.setattr(
        main_module,
        "database_health",
        lambda: {"database": "peg", "schema": "astacus_bot", "notes": 3},
    )

    response = client.get("/health")

    assert response.status_code == 200
    assert response.json()["database"]["schema"] == "astacus_bot"


def test_list_notes_returns_items(monkeypatch):
    monkeypatch.setattr(
        main_module,
        "fetch_recent_notes",
        lambda: [{"author": "cass", "body": "ship it", "created_at": "now"}],
    )

    response = client.get("/v1/astacus-bot/notes")

    assert response.status_code == 200
    assert response.json()["items"][0]["author"] == "cass"


def test_create_note_returns_inserted_note(monkeypatch):
    monkeypatch.setattr(
        main_module,
        "insert_note",
        lambda author, body: {"id": 1, "author": author, "body": body, "created_at": "now"},
    )

    response = client.post(
        "/v1/astacus-bot/notes",
        json={"author": "astacus", "body": "all green"},
    )

    assert response.status_code == 200
    assert response.json()["item"]["body"] == "all green"
