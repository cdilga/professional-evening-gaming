CREATE SCHEMA IF NOT EXISTS session_hub;

CREATE TABLE IF NOT EXISTS session_hub.sessions (
  id BIGSERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  game_name TEXT NOT NULL,
  scheduled_for TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'planned',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS session_hub_sessions_scheduled_for_idx
  ON session_hub.sessions (scheduled_for ASC);
