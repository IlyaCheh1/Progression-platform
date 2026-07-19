-- 0003_add_attachments.sql

-- +goose Up
-- Create attachment table for file uploads
CREATE TABLE IF NOT EXISTS attachment (
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

CREATE INDEX IF NOT EXISTS idx_attachment_conv ON attachment(conversation_id);
CREATE INDEX IF NOT EXISTS idx_attachment_message ON attachment(message_id);
CREATE INDEX IF NOT EXISTS idx_attachment_status_created ON attachment(status, created_at) WHERE status = 'init';


-- +goose Down
DROP INDEX IF EXISTS idx_attachment_status_created;
DROP INDEX IF EXISTS idx_attachment_message;
DROP INDEX IF EXISTS idx_attachment_conv;
DROP TABLE IF EXISTS attachment;