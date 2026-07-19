.PHONY: run migrate-up build test

CONFIG_FILE ?= configs/values.yml
MIGRATIONS_DIR ?= db/migrations

run:
	go run ./cmd/chat -config=$(CONFIG_FILE)

migrate-up:
	go run cmd/migrate/main.go -config=$(CONFIG_FILE) -migrations=$(MIGRATIONS_DIR) -cmd=up

build:
	go build -o bin/support-chat ./cmd/chat

test:
	go test ./...
