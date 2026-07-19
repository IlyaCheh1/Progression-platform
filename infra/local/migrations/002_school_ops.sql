-- School operational schemas (Phase A/B)
CREATE SCHEMA IF NOT EXISTS school_crm;
CREATE SCHEMA IF NOT EXISTS school_schedule;
CREATE SCHEMA IF NOT EXISTS school_booking;
CREATE SCHEMA IF NOT EXISTS school_commerce;
CREATE SCHEMA IF NOT EXISTS school_communications;
CREATE SCHEMA IF NOT EXISTS school_analytics;

CREATE TABLE IF NOT EXISTS school_training.records (
  training_record_id TEXT NOT NULL,
  revision INT NOT NULL,
  student_id TEXT NOT NULL,
  character_id TEXT,
  session_id TEXT,
  coach_id TEXT,
  occurred_at TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL,
  payload JSONB NOT NULL,
  PRIMARY KEY (training_record_id, revision)
);

CREATE TABLE IF NOT EXISTS school_mastery.ledger (
  id TEXT PRIMARY KEY,
  student_id TEXT NOT NULL,
  weapon_key TEXT NOT NULL,
  delta_units BIGINT NOT NULL,
  reason TEXT NOT NULL,
  local_date DATE,
  idempotency_key TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS school_crm.leads (
  id TEXT PRIMARY KEY,
  payload JSONB NOT NULL,
  stage TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS school_schedule.sessions (
  id TEXT PRIMARY KEY,
  hall_id TEXT NOT NULL,
  starts_at TIMESTAMPTZ NOT NULL,
  ends_at TIMESTAMPTZ NOT NULL,
  payload JSONB NOT NULL,
  cancelled BOOLEAN NOT NULL DEFAULT false
);

CREATE TABLE IF NOT EXISTS school_booking.bookings (
  id TEXT PRIMARY KEY,
  payload JSONB NOT NULL,
  status TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS school_commerce.orders (
  id TEXT PRIMARY KEY,
  student_id TEXT NOT NULL,
  status TEXT NOT NULL,
  payload JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS school_commerce.payments (
  id TEXT PRIMARY KEY,
  order_id TEXT NOT NULL REFERENCES school_commerce.orders(id),
  attempt_id TEXT NOT NULL UNIQUE,
  provider_payment_id TEXT,
  status TEXT NOT NULL,
  payload JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS outbox.inbox (
  idempotency_key TEXT PRIMARY KEY,
  event_type TEXT NOT NULL,
  processed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
