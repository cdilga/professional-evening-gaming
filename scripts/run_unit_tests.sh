#!/usr/bin/env bash

set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
VENV_DIR="$ROOT/.venv"

if [ ! -x "$VENV_DIR/bin/python" ]; then
  python3 -m venv "$VENV_DIR"
fi

"$VENV_DIR/bin/python" -m pip install -q -r "$ROOT/projects/astacus-bot/api/requirements.txt" -r "$ROOT/projects/peg-session-hub/api/requirements.txt"
npm --prefix "$ROOT/projects/peg-live-lobby/app" install --silent

PYTHONPATH="$ROOT/projects/astacus-bot/api" "$VENV_DIR/bin/python" -m pytest "$ROOT/projects/astacus-bot/api/tests"
PYTHONPATH="$ROOT/projects/peg-session-hub/api" "$VENV_DIR/bin/python" -m pytest "$ROOT/projects/peg-session-hub/api/tests"
npm --prefix "$ROOT/projects/peg-live-lobby/app" test
