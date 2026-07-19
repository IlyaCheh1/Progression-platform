-- +goose Up
ALTER TABLE app_user
DROP CONSTRAINT IF EXISTS app_user_username_key;

-- +goose Down
ALTER TABLE app_user
    ADD CONSTRAINT app_user_username_key UNIQUE (username);