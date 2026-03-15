CREATE SCHEMA IF NOT EXISTS astacus_bot;

CREATE TABLE IF NOT EXISTS astacus_bot.notes (
  id BIGSERIAL PRIMARY KEY,
  author TEXT NOT NULL,
  body TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS astacus_bot_notes_created_at_idx
  ON astacus_bot.notes (created_at DESC);
