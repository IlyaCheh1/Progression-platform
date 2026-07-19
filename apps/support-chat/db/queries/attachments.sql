-- sqlc/queries/attachments.sql

-- name: CreateAttachment :one
INSERT INTO attachment (
  conversation_id, storage_key, file_name, content_type, size_bytes
) VALUES (
  $1, $2, $3, $4, $5
)
RETURNING id, conversation_id, message_id, storage_key, file_name, content_type, size_bytes, status, created_at;

-- name: MarkAttachmentComplete :one
UPDATE attachment 
SET status = 'complete' 
WHERE id = $1 AND conversation_id = $2 AND status = 'init'
RETURNING id, conversation_id, message_id, storage_key, file_name, content_type, size_bytes, status, created_at;

-- name: FindAttachmentsByConvId :many
SELECT id, conversation_id, message_id, storage_key, file_name, content_type, size_bytes, status, created_at
FROM attachment
WHERE conversation_id = @conversation_id
  AND id = ANY(@attachment_ids::uuid[]);

-- name: BindAttachmentToMessage :execrows
UPDATE attachment 
SET message_id = $3 
WHERE id = $1 AND conversation_id = $2 AND status = 'complete' AND message_id IS NULL;

-- name: FindByMessId :many
SELECT id, conversation_id, message_id, storage_key, file_name, content_type, size_bytes, status, created_at
FROM attachment 
WHERE message_id = $1;

-- name: FindByMessIds :many
SELECT id, message_id
FROM attachment
WHERE message_id = ANY(@message_ids::uuid[]);;

-- name: FindAttachmentById :one
SELECT id, conversation_id, message_id, storage_key, file_name, content_type, size_bytes, status, created_at
FROM attachment 
WHERE id = $1;

-- name: DeleteOldInitAttachments :exec
DELETE FROM attachment 
WHERE status = 'init' AND created_at < $1;