-- Foundation schemas (logical owners). Applied when Postgres is available.
CREATE SCHEMA IF NOT EXISTS platform_character;
CREATE SCHEMA IF NOT EXISTS platform_progression;
CREATE SCHEMA IF NOT EXISTS platform_reward;
CREATE SCHEMA IF NOT EXISTS school_identity;
CREATE SCHEMA IF NOT EXISTS school_training;
CREATE SCHEMA IF NOT EXISTS school_mastery;
CREATE SCHEMA IF NOT EXISTS outbox;

CREATE TABLE IF NOT EXISTS outbox.events (
  id TEXT PRIMARY KEY,
  event_type TEXT NOT NULL,
  idempotency_key TEXT NOT NULL UNIQUE,
  tenant_id TEXT NOT NULL,
  payload JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  published_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS platform_character.characters (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  tenant_id TEXT NOT NULL,
  version BIGINT NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS platform_progression.ledger (
  id TEXT PRIMARY KEY,
  character_id TEXT NOT NULL,
  amount BIGINT NOT NULL CHECK (amount >= 0),
  reason TEXT NOT NULL,
  idempotency_key TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS school_mastery.snapshots (
  student_id TEXT NOT NULL,
  weapon_key TEXT NOT NULL,
  units BIGINT NOT NULL,
  rank INT NOT NULL DEFAULT 0,
  source_hash TEXT NOT NULL,
  as_of_date DATE NOT NULL,
  PRIMARY KEY (student_id, weapon_key, source_hash)
);
