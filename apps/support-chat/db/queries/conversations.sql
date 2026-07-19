-- sqlc/queries/conversations.sql

-- name: CreateConversation :one
INSERT INTO conversation (type,
                          status,
                          topic,
                          tg_support_chat_id,
                          tg_support_topic_id,
                          source,
                          page_url,
                          locale,
                          timezone,
                          app_version,
                          created_by)
VALUES ($1, -- type
        $2, -- status
        $3, -- topic
        $4, -- tg_support_chat_id
        $5, -- tg_support_topic_id
        $6, -- source
        $7, -- page_url
        $8, -- locale
        $9, -- timezone
        $10, -- app_version
        $11 -- created_by
       ) RETURNING
    id,
    type,
    status,
    topic,
    tg_support_chat_id,
    tg_support_topic_id,
    source,
    page_url,
    locale,
    timezone,
    app_version,
    is_like,
    created_by,
    created_at;

-- name: AddParticipant :exec
INSERT INTO conversation_participant (conversation_id, user_id, role)
VALUES ($1, $2, $3) ON CONFLICT (conversation_id, user_id) DO NOTHING;

-- name: FindConversationsByUser :many
SELECT
    c.id,
    c.type,
    c.status,
    c.topic,
    c.tg_support_chat_id,
    c.tg_support_topic_id,
    c.source,
    c.page_url,
    c.locale,
    c.timezone,
    c.app_version,
    c.is_like,
    c.created_by,
    c.created_at
FROM conversation c
         JOIN conversation_participant p ON p.conversation_id = c.id
WHERE p.user_id = $1
ORDER BY c.created_at DESC, c.id DESC
    LIMIT $2;

-- name: UpdateConversationStatus :one
UPDATE conversation
SET status = $2
WHERE id = $1 RETURNING
    id,
    type,
    status,
    topic,
    tg_support_chat_id,
    tg_support_topic_id,
    source,
    page_url,
    locale,
    timezone,
    app_version,
    is_like,
    created_by,
    created_at;

-- name: FindConversationByThread :one
SELECT id,
       type,
       status,
       topic,
       tg_support_chat_id,
       tg_support_topic_id,
       source,
       page_url,
       locale,
       timezone,
       app_version,
       is_like,
       created_by,
       created_at
FROM conversation
WHERE tg_support_chat_id = $1
  AND tg_support_topic_id = $2 LIMIT 1;

-- name: IsParticipant :one
SELECT EXISTS (SELECT 1
               FROM conversation_participant
               WHERE conversation_id = $1
                 AND user_id = $2) AS is_participant;

-- name: FindOpenConversationByUserId :one
SELECT
    c.id, c.type, c.status, c.topic,
    c.tg_support_chat_id, c.tg_support_topic_id,
    c.source, c.page_url, c.locale, c.timezone, c.app_version, c.is_like,
    c.created_by, c.created_at
FROM conversation c
         JOIN conversation_participant p ON p.conversation_id = c.id
WHERE p.user_id = $1
  AND c.type = $2
  AND c.status IN ('open','pending')
ORDER BY c.created_at DESC
    LIMIT 1;

-- name: UpdateTelegramInfo :one
UPDATE conversation
SET tg_support_chat_id = $2,
    tg_support_topic_id = $3
WHERE id = $1 RETURNING
    id,
    type,
    status,
    topic,
    tg_support_chat_id,
    tg_support_topic_id,
    source,
    page_url,
    locale,
    timezone,
    app_version,
    is_like,
    created_by,
    created_at;

-- name: FindConversationById :one
SELECT id,
       type,
       status,
       topic,
       tg_support_chat_id,
       tg_support_topic_id,
       source,
       page_url,
       locale,
       timezone,
       app_version,
       is_like,
       created_by,
       created_at
FROM conversation
WHERE id = $1;

-- name: UpdateConversationRating :one
UPDATE conversation
SET is_like = $2
WHERE id = $1 RETURNING
    id,
    type,
    status,
    topic,
    tg_support_chat_id,
    tg_support_topic_id,
    source,
    page_url,
    locale,
    timezone,
    app_version,
    is_like,
    created_by,
    created_at;