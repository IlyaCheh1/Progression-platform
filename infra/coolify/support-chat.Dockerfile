FROM golang:1.24-alpine AS build

WORKDIR /src

COPY apps/support-chat apps/support-chat

WORKDIR /src/apps/support-chat
ENV GOWORK=off
RUN go build -o /out/support-chat ./cmd/chat && \
    go build -o /out/support-chat-migrate ./cmd/migrate

FROM alpine:3.20

RUN apk add --no-cache ca-certificates

WORKDIR /app

COPY --from=build /out/support-chat ./support-chat
COPY --from=build /out/support-chat-migrate ./support-chat-migrate
COPY apps/support-chat/configs ./configs
COPY apps/support-chat/db/migrations ./db/migrations
COPY infra/coolify/support-chat-entrypoint.sh ./entrypoint.sh

RUN chmod +x ./entrypoint.sh

ENV SUPPORT_CHAT_CONFIG=configs/values.prod.yml

EXPOSE 8084

ENTRYPOINT ["./entrypoint.sh"]
