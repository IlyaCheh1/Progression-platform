-- sqlc/queries/user.sql

-- name: CreateUser :one
INSERT INTO app_user (id,
                      username)
VALUES ($1, $2) RETURNING
    id,
    username,
    created_at;

-- name: FindUserByID :one
SELECT id,
       username,
       created_at
FROM app_user
WHERE id = $1;