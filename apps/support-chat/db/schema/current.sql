-- db/schema/current.sql
-- Snapshot of the current schema after applying migrations up to 0005_username_constraint.sql

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE app_user (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    username text NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE conversation (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    type text NOT NULL,
    status text NOT NULL DEFAULT 'open',
    topic text,
    tg_support_chat_id bigint,
    tg_support_topic_id integer,
    source              text NOT NULL CHECK (source IN ('web', 'telegram', 'system')),
    page_url            text,
    locale              text,
    timezone            numeric,
    app_version         text,
    is_like             boolean,
    created_by uuid REFERENCES app_user(id),
    created_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT conversation_type_chk CHECK (type IN ('support','direct','group','ai')),
    CONSTRAINT conversation_status_chk CHECK (status IN ('open','pending','closed'))
);

CREATE INDEX idx_conversation_type_status_created
    ON conversation (type, status, created_at DESC);

CREATE TABLE conversation_participant (
    conversation_id uuid NOT NULL REFERENCES conversation(id) ON DELETE CASCADE,
    user_id uuid NOT NULL REFERENCES app_user(id) ON DELETE CASCADE,
    role text NOT NULL DEFAULT 'member',
    PRIMARY KEY (conversation_id, user_id)
);

CREATE INDEX idx_participant_user
    ON conversation_participant (user_id);

CREATE SEQUENCE IF NOT EXISTS message_seq;

CREATE TABLE message (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id uuid NOT NULL REFERENCES conversation(id) ON DELETE CASCADE,
    seq_no bigint NOT NULL DEFAULT nextval('message_seq'),
    sender_kind text NOT NULL CHECK (sender_kind IN ('user','support','assistant','system')),
    source text NOT NULL CHECK (source IN ('web','telegram','system')),
    content_type text NOT NULL DEFAULT 'text' CHECK (content_type IN ('text')),
    content_text text,
    client_id text,
    tg_message_id bigint,
    reply_to_message_id uuid REFERENCES message(id) NULL,
    created_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX ux_message_conv_seq ON message (conversation_id, seq_no);
CREATE INDEX idx_message_conv_created ON message (conversation_id, created_at);
CREATE UNIQUE INDEX ux_message_conv_client_id ON message (conversation_id, client_id) WHERE client_id IS NOT NULL;
CREATE INDEX idx_message_reply_to ON message (reply_to_message_id) WHERE reply_to_message_id IS NOT NULL;

CREATE TABLE attachment (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id uuid NOT NULL REFERENCES conversation(id) ON DELETE CASCADE,
    message_id      uuid REFERENCES message(id) ON DELETE CASCADE,
    storage_key     text NOT NULL,
    file_name       text NOT NULL,
    content_type    text NOT NULL,
    size_bytes      bigint,
    status          text NOT NULL CHECK (status IN ('init','complete')) DEFAULT 'init',
    created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_attachment_conv ON attachment(conversation_id);
CREATE INDEX idx_attachment_message ON attachment(message_id);

CREATE OR REPLACE VIEW conversation_last_message AS
SELECT DISTINCT ON (m.conversation_id)
    m.conversation_id,
    m.id              AS message_id,
    m.seq_no,
    m.created_at,
    m.sender_kind,
    m.content_type,
    m.content_text
FROM message m
ORDER BY m.conversation_id, m.seq_no DESC;
