-- Auth sessions live 30 days; persist expiry alongside opaque tokens.
ALTER TABLE school_identity.access_tokens
  ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ;

UPDATE school_identity.access_tokens
SET expires_at = now() + interval '30 days'
WHERE expires_at IS NULL;

ALTER TABLE school_identity.access_tokens
  ALTER COLUMN expires_at SET DEFAULT (now() + interval '30 days');

ALTER TABLE school_identity.access_tokens
  ALTER COLUMN expires_at SET NOT NULL;
