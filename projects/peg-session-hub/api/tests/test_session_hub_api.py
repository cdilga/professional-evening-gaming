from importlib.util import module_from_spec, spec_from_file_location
from pathlib import Path
import sys

from fastapi.testclient import TestClient


ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))
spec = spec_from_file_location("session_hub_main", ROOT / "app" / "main.py")
main_module = module_from_spec(spec)
assert spec and spec.loader
spec.loader.exec_module(main_module)

client = TestClient(main_module.app)


def test_health_returns_session_snapshot(monkeypatch):
    monkeypatch.setattr(
        main_module,
        "health_snapshot",
        lambda: {"database": "peg", "schema": "session_hub", "sessions": 2},
    )

    response = client.get("/health")

    assert response.status_code == 200
    assert response.json()["database"]["sessions"] == 2


def test_list_sessions_returns_payload(monkeypatch):
    monkeypatch.setattr(
        main_module,
        "list_sessions",
        lambda: [{"title": "Friday LAN", "game_name": "Helldivers 2", "status": "planned"}],
    )

    response = client.get("/v1/sessions")

    assert response.status_code == 200
    assert response.json()["items"][0]["game_name"] == "Helldivers 2"


def test_create_session_returns_inserted_row(monkeypatch):
    monkeypatch.setattr(
        main_module,
        "create_session",
        lambda title, game_name, scheduled_for: {
            "id": 9,
            "title": title,
            "game_name": game_name,
            "scheduled_for": scheduled_for,
            "status": "planned",
            "created_at": "now",
        },
    )

    response = client.post(
        "/v1/sessions",
        json={
            "title": "Postgres Night",
            "game_name": "Factorio",
            "scheduled_for": "2026-03-20T11:00:00Z",
        },
    )

    assert response.status_code == 200
    assert response.json()["item"]["title"] == "Postgres Night"
