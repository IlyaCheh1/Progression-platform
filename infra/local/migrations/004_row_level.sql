-- Row-level platform persistence (replaces platform_snapshot blob as source of truth)
CREATE SCHEMA IF NOT EXISTS platform_meta;
CREATE SCHEMA IF NOT EXISTS platform_inventory;
CREATE SCHEMA IF NOT EXISTS platform_support;
CREATE SCHEMA IF NOT EXISTS platform_assets;
CREATE SCHEMA IF NOT EXISTS school_game;

CREATE TABLE IF NOT EXISTS platform_meta.store (
  id TEXT PRIMARY KEY,
  version INT NOT NULL DEFAULT 1,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE platform_character.characters
  ADD COLUMN IF NOT EXISTS payload JSONB;

CREATE TABLE IF NOT EXISTS school_identity.students (
  id TEXT PRIMARY KEY,
  login TEXT NOT NULL UNIQUE,
  payload JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS school_identity.access_tokens (
  token TEXT PRIMARY KEY,
  student_id TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS school_identity.inbox_seen (
  idempotency_key TEXT PRIMARY KEY
);

CREATE TABLE IF NOT EXISTS school_identity.guardian_links (
  guardian_id TEXT NOT NULL,
  student_id TEXT NOT NULL,
  PRIMARY KEY (guardian_id, student_id)
);

CREATE TABLE IF NOT EXISTS school_identity.minors (
  student_id TEXT PRIMARY KEY
);

CREATE TABLE IF NOT EXISTS platform_inventory.holdings (
  student_id TEXT NOT NULL,
  item_key TEXT NOT NULL,
  payload JSONB NOT NULL,
  PRIMARY KEY (student_id, item_key)
);

CREATE TABLE IF NOT EXISTS platform_support.cases (
  id TEXT PRIMARY KEY,
  payload JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS platform_assets.revisions (
  id TEXT PRIMARY KEY,
  payload JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS school_crm.tasks (
  id TEXT PRIMARY KEY,
  payload JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS school_schedule.reservations (
  id TEXT PRIMARY KEY,
  payload JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS school_commerce.memberships (
  id TEXT PRIMARY KEY,
  student_id TEXT NOT NULL,
  status TEXT NOT NULL,
  payload JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS school_game.quest_progress (
  student_id TEXT NOT NULL,
  quest_key TEXT NOT NULL,
  payload JSONB NOT NULL,
  PRIMARY KEY (student_id, quest_key)
);

CREATE TABLE IF NOT EXISTS school_game.achievements (
  student_id TEXT NOT NULL,
  achievement_key TEXT NOT NULL,
  payload JSONB NOT NULL,
  PRIMARY KEY (student_id, achievement_key)
);

CREATE TABLE IF NOT EXISTS school_game.kill_switches (
  switch_key TEXT PRIMARY KEY,
  enabled BOOLEAN NOT NULL
);

CREATE TABLE IF NOT EXISTS school_game.attendance_counts (
  student_id TEXT PRIMARY KEY,
  count INT NOT NULL
);

CREATE TABLE IF NOT EXISTS school_game.rank_floors (
  student_id TEXT NOT NULL,
  weapon_key TEXT NOT NULL,
  floor_units BIGINT NOT NULL,
  PRIMARY KEY (student_id, weapon_key)
);

CREATE TABLE IF NOT EXISTS school_game.decay_applied (
  decay_key TEXT PRIMARY KEY
);

CREATE TABLE IF NOT EXISTS school_game.comms_log (
  seq BIGSERIAL PRIMARY KEY,
  line TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS school_game.import_batches (
  id TEXT PRIMARY KEY,
  payload JSONB NOT NULL
);

CREATE TABLE IF NOT EXISTS school_game.active_season (
  id TEXT PRIMARY KEY,
  payload JSONB NOT NULL
);

CREATE TABLE IF NOT EXISTS school_game.battle_pass (
  student_id TEXT PRIMARY KEY,
  payload JSONB NOT NULL
);

CREATE TABLE IF NOT EXISTS school_game.talent_unlocks (
  student_id TEXT NOT NULL,
  talent_key TEXT NOT NULL,
  PRIMARY KEY (student_id, talent_key)
);

INSERT INTO platform_meta.store (id, version) VALUES ('platform.main', 1)
ON CONFLICT (id) DO NOTHING;
