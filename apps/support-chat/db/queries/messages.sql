-- sqlc/queries/messages.sql

-- name: CreateMessage :one
INSERT INTO message (
  conversation_id, sender_kind, source, content_type, content_text, client_id, tg_message_id, reply_to_message_id
) VALUES (
  $1, $2, $3, $4, $5, $6, $7, $8
)
RETURNING id, conversation_id, seq_no, sender_kind, source, content_type, content_text, client_id, tg_message_id, reply_to_message_id, created_at;

-- name: UpdateMessageTelegramId :exec
UPDATE message SET tg_message_id = $2 WHERE id = $1;

-- name: FindMessageByConvId :many
SELECT id, conversation_id, seq_no, sender_kind, source, content_type, content_text, client_id, tg_message_id, reply_to_message_id, created_at
FROM message
WHERE conversation_id = $1 AND seq_no > $2
ORDER BY seq_no ASC
LIMIT $3;

-- name: FindMessageByConvIdDesc :many
SELECT id, conversation_id, seq_no, sender_kind, source, content_type, content_text, client_id, tg_message_id, reply_to_message_id, created_at
FROM message
WHERE conversation_id = $1 AND seq_no > $2
ORDER BY seq_no DESC
    LIMIT $3;

-- name: GetLastSeq :one
SELECT COALESCE(MAX(seq_no), 0) AS last_seq
FROM message
WHERE conversation_id = $1;

-- name: FindMessageByClientId :one
SELECT id, conversation_id, seq_no, sender_kind, source, content_type, content_text, client_id, tg_message_id, reply_to_message_id, created_at
FROM message 
WHERE conversation_id = $1 AND client_id = $2;
