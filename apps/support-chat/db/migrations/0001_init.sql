-- 0001_init.sql

-- +goose Up
-- goose wraps this migration in a transaction by default
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS app_user
(
    id           uuid PRIMARY KEY     DEFAULT gen_random_uuid(),
    display_name text,
    email        text UNIQUE,
    created_at   timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS conversation (
    id                  uuid PRIMARY KEY     DEFAULT gen_random_uuid(),
    type                text        NOT NULL CHECK (type IN ('support', 'direct', 'group', 'ai')),
    status              text        NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'pending', 'closed')),
    topic               text,
    tg_support_chat_id  bigint,
    tg_support_topic_id integer,
    source              text        NOT NULL CHECK (source IN ('web', 'telegram', 'system')),
    page_url            text,
    locale              text,
    timezone            numeric,    -- float, UTC offset (e.g. 3.0)
    app_version         text,
    created_by          uuid REFERENCES app_user (id),
    created_at          timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_conversation_type_status_created
    ON conversation (type, status, created_at DESC);

CREATE TABLE IF NOT EXISTS conversation_participant
(
    conversation_id uuid NOT NULL REFERENCES conversation (id) ON DELETE CASCADE,
    user_id         uuid NOT NULL REFERENCES app_user (id) ON DELETE CASCADE,
    role            text NOT NULL DEFAULT 'member',
    PRIMARY KEY (conversation_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_participant_user
    ON conversation_participant (user_id);

CREATE SEQUENCE IF NOT EXISTS message_seq;

CREATE TABLE IF NOT EXISTS message
(
    id                  uuid PRIMARY KEY     DEFAULT gen_random_uuid(),
    conversation_id     uuid        NOT NULL REFERENCES conversation (id) ON DELETE CASCADE,
    seq_no              bigint      NOT NULL DEFAULT nextval('message_seq'),
    sender_kind         text        NOT NULL CHECK (sender_kind IN ('user', 'support', 'assistant', 'system')),
    source              text        NOT NULL CHECK (source IN ('web', 'telegram', 'system')),
    content_type        text        NOT NULL DEFAULT 'text' CHECK (content_type IN ('text')),
    content_text        text,
    client_id           text,
    tg_message_id       bigint,
    reply_to_message_id uuid REFERENCES message (id) NULL,
    created_at          timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS ux_message_conv_seq
    ON message (conversation_id, seq_no);

CREATE INDEX IF NOT EXISTS idx_message_conv_created
    ON message (conversation_id, created_at);


CREATE UNIQUE INDEX IF NOT EXISTS ux_message_conv_client_id
    ON message (conversation_id, client_id) WHERE client_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_message_reply_to
    ON message (reply_to_message_id) WHERE reply_to_message_id IS NOT NULL;

CREATE OR REPLACE VIEW conversation_last_message AS
SELECT DISTINCT ON (m.conversation_id) m.conversation_id,
                                       m.id AS message_id,
                                       m.seq_no,
                                       m.created_at,
                                       m.sender_kind,
                                       m.content_type,
                                       m.content_text
FROM message m
ORDER BY m.conversation_id, m.seq_no DESC;

-- +goose Down
DROP VIEW IF EXISTS conversation_last_message;

DROP INDEX IF EXISTS idx_message_reply_to;
DROP INDEX IF EXISTS ux_message_conv_client_id;
DROP INDEX IF EXISTS idx_message_conv_created;
DROP INDEX IF EXISTS ux_message_conv_seq;

DROP TABLE IF EXISTS message;
DROP SEQUENCE IF EXISTS message_seq;

DROP INDEX IF EXISTS idx_participant_user;
DROP TABLE IF EXISTS conversation_participant;

DROP INDEX IF EXISTS idx_conversation_type_status_created;
DROP TABLE IF EXISTS conversation;

DROP TABLE IF EXISTS app_user;