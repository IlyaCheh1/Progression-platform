#!/bin/sh
set -eu

CONFIG="${SUPPORT_CHAT_CONFIG:-configs/values.prod.yml}"

./support-chat-migrate -config="${CONFIG}" -migrations=db/migrations -cmd=up
exec ./support-chat -config="${CONFIG}"
