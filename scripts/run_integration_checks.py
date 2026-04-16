#!/usr/bin/env python3

from __future__ import annotations

import json
import sys
from pathlib import Path
from urllib.error import URLError
from urllib.request import urlopen


ROOT = Path(__file__).resolve().parent.parent
DIST_PROJECTS = ROOT / "dist" / "data" / "projects.json"
SITE_ROOT = ROOT / "site"


def fail(message: str) -> None:
    print(f"integration check failed: {message}", file=sys.stderr)
    raise SystemExit(1)


def ensure_site_contracts() -> None:
    payload = json.loads(DIST_PROJECTS.read_text())
    projects = payload.get("projects", [])
    if not projects:
      fail("no projects found in dist/data/projects.json")

    for project in projects:
        page = project["links"]["page"].removeprefix("/")
        page_path = SITE_ROOT / page / "index.html"
        if not page_path.exists():
            fail(f"missing page for {project['slug']}: {page_path}")

        if project["slug"] in {"astacus-bot", "peg-session-hub", "peg-live-lobby", "peg-tanker-command"}:
            html = page_path.read_text()
            if 'data-demo=' not in html:
                fail(f"project page for {project['slug']} is missing demo hooks")


def ensure_live_checks() -> None:
    targets = [
        "https://peg-api.dilger.dev/health",
        "https://peg-api.dilger.dev/session-hub/health",
        "https://peg-api.dilger.dev/live-lobby/health",
        "https://peg-api.dilger.dev/tanker-command/health",
    ]
    for target in targets:
        try:
            with urlopen(target, timeout=10) as response:
                if response.status != 200:
                    fail(f"live check returned {response.status} for {target}")
        except URLError as exc:
            fail(f"could not reach {target}: {exc}")


def main() -> None:
    ensure_site_contracts()
    if "--live" in sys.argv:
        ensure_live_checks()
    print("integration checks passed")


if __name__ == "__main__":
    main()
