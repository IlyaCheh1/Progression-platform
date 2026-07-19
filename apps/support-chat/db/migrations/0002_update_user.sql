-- +goose Up
ALTER TABLE app_user
    DROP COLUMN display_name,
    DROP COLUMN email;

ALTER TABLE app_user
    ADD COLUMN username text UNIQUE NOT NULL;

-- +goose Down
ALTER TABLE app_user
    DROP COLUMN username;

ALTER TABLE app_user
    ADD COLUMN display_name text,
    ADD COLUMN email text UNIQUE;