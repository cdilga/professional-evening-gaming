-- Create project schemas for the shared PEG database.
-- Each service project owns its own schema and runs migrations at startup.

CREATE SCHEMA IF NOT EXISTS astacus_bot;
CREATE SCHEMA IF NOT EXISTS session_hub;
CREATE SCHEMA IF NOT EXISTS peg_meta;
