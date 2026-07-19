-- +goose Up
-- Add is_like column to conversation table for rating functionality
ALTER TABLE conversation ADD COLUMN is_like boolean;

-- +goose Down
-- Remove is_like column from conversation table
ALTER TABLE conversation DROP COLUMN is_like;
