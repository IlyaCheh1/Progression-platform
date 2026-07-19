FROM golang:1.22-alpine AS build

WORKDIR /src

COPY packages/contracts packages/contracts
COPY apps/school-api apps/school-api

# Production image must not depend on test package names.
RUN find /src -name '*_test.go' -delete

WORKDIR /src/apps/school-api
ENV GOWORK=off
RUN go build -o /out/school-api ./cmd/school-api

FROM alpine:3.20

RUN apk add --no-cache ca-certificates

WORKDIR /app

COPY --from=build /out/school-api ./school-api
COPY 015-platform-development-agent-spec.md ./015-platform-development-agent-spec.md
COPY infra/local/seed infra/local/seed

ENV SCHOOL_API_ADDR=0.0.0.0:8082

EXPOSE 8082

CMD ["./school-api"]
