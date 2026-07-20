# Coolify: что задать для сайта

Минимум для работающего фронта с логином и админкой — **три сервиса** (если нужен чат поддержки):

1. **web** (Next.js)
2. **school-api** (Go)
3. **support-chat** (Go, og-chat + Telegram webhook)

OnlyID идёт напрямую через web BFF (`/api/auth/*`) + `school-api` (`POST /v1/auth/onlyid`).  
`auth-adapter` для продакшена не нужен.

Шаблон переменных: [`env.example`](./env.example).

## Configuration web (обязательно)

Если Start Command пустой, контейнер уходит в restart loop:

```text
/bin/bash: -c: option requires an argument
```

И Terminal пишет: *No containers are running…*

В **Configuration → General / Build** задай явно:

| Поле | Значение |
|---|---|
| Base Directory | `/` (корень репо) |
| Install Command | `pnpm install --frozen-lockfile` |
| Build Command | `pnpm --filter @mos/web build` |
| Start Command | `pnpm --filter @mos/web start` |
| Port | `3000` |

Либо оставь пустым и используй `nixpacks.toml` из корня репо (после деплоя свежего коммита).

После правки — **Redeploy**, дождись статуса Running, потом открывай Terminal.

## Web (Coolify → Environment)

| Переменная | Обязательно | Когда |
|---|---|---|
| `NEXT_PUBLIC_SCHOOL_API` | да | build + runtime |
| `NEXT_PUBLIC_SITE_URL` | да (OnlyID) | build + runtime |
| `SSO_BASE_URL` | да (OnlyID) | runtime |
| `SSO_ISSUER` | да (OnlyID) | runtime |
| `SSO_CLIENT_ID` | да (OnlyID) | runtime |
| `SSO_CLIENT_SECRET` | да (OnlyID) | runtime |
| `SSO_OAUTH_CALLBACK_URL` | да (OnlyID) | runtime |
| `AUTH_SECRET` | да (OnlyID) | runtime |
| `SSO_BRIDGE_SECRET` | да (OnlyID) | runtime (тот же, что у school-api) |
| `SCHOOL_API_INTERNAL_URL` | рекомендуется | runtime (внутренний URL school-api) |
| `NEXT_PUBLIC_PLATFORM_API` | нет | можно сразу |
| `NEXT_PUBLIC_SUPPORT_CHAT_API` | да** | build + runtime, если есть чат |
| `NEXT_PUBLIC_SUPPORT_CHAT_WS` | да** | build + runtime, wss:// тот же хост |

\*\* Для чата: `https://chat-api.mastersword.ru` (API и WS на одном хосте).

### OnlyID (prod)

В кабинете OnlyID для клиента должны быть:

- `redirect_uris`: `https://mastersword.ru/api/auth/oauth/callback`
- `post_logout_redirect_uris`: `https://mastersword.ru/login`
- `scopes`: `openid profile email`

Пример env для **web**:

```env
NEXT_PUBLIC_SITE_URL=https://mastersword.ru
SSO_BASE_URL=https://onlyid.ru
SSO_ISSUER=https://api.onlyid.ru/api/v1/user
SSO_CLIENT_ID=cid_...
SSO_CLIENT_SECRET=...
SSO_OAUTH_CALLBACK_URL=https://mastersword.ru/api/auth/oauth/callback
AUTH_SECRET=<случайная длинная строка>
SSO_BRIDGE_SECRET=<случайная длинная строка>
SCHOOL_API_INTERNAL_URL=http://school-api:8082
```

Для **school-api** добавь тот же `SSO_BRIDGE_SECRET`.

Вход: при первом OnlyID-логине, если email ещё нет в школе, создаётся ученик (`student`) с `login` = email и именем из OnlyID. Дальше пользователь проходит onboarding. Существующие логины в ростере матчятся без дублей (case-insensitive).

После смены `NEXT_PUBLIC_*` сделай **Rebuild**.

## school-api (отдельный сервис в Coolify)

Логин с прод-сайта ходит в браузере на `NEXT_PUBLIC_SCHOOL_API`. Без **второго** сервиса school-api вход не работает.

> **Не используй Nixpacks** для school-api: в корне репо `package.json`, Nixpacks выбирает Node и в образе нет `go` (`go: command not found`).

### Configuration → General / Build

| Поле | Значение |
|---|---|
| Repository | `IlyaCheh1/Progression-platform` |
| Branch | `main` |
| Base Directory | `/` |
| **Build Pack** | **Dockerfile** |
| **Dockerfile Location** | `infra/coolify/school-api.Dockerfile` |
| Port | `8082` |
| Domains | `https://school-api.mastersword.ru` |

Start / Build Command оставь пустым — задаётся в Dockerfile.

В образ копируются `infra/local/seed/students.json` (ростер школы) и `schemas/content/school.fencing.starter.json` (боевой каталог талантов/квестов). Без starter в логах будет `0 talents`, а изучение таланта вернёт «Талант не найден в каталоге». При непустой Postgres сид ростера пропускается (`skip seed`).

### Environment

| Переменная | Значение |
|---|---|
| `SCHOOL_API_ADDR` | `0.0.0.0:8082` |
| `SSO_BRIDGE_SECRET` | тот же, что у web |
| `S3_ENDPOINT` | `https://s3.ru-7.storage.selcloud.ru` |
| `S3_REGION` | `ru-7` |
| `S3_ACCESS_KEY` | Selectel S3 key |
| `S3_SECRET_KEY` | Selectel S3 secret |
| `S3_BUCKET` | bucket name |
| `S3_PUBLIC_BASE_URL` | `https://…selstorage.ru` (публичный URL бакета) |

Без `0.0.0.0` API слушает только loopback внутри контейнера и снаружи недоступен.  
Без `S3_*` эндпоинты аватара отвечают `503 storage_unavailable`.

### Проверка после деплоя

Открой в браузере:

```text
https://school-api.mastersword.ru/health
```

Должен вернуть JSON с `"ok": true`. Этот URL (без `/health`) пропиши в web:

```env
NEXT_PUBLIC_SCHOOL_API=https://school-api.mastersword.ru
```

**Buildtime + Runtime** в сервисе **web**, затем **Rebuild** web.

## support-chat (отдельный сервис Go) — чат + Telegram webhook

Виджет на сайте ходит в этот API. Telegram webhook **постоянный**, если задан публичный URL.

### Configuration → General / Build

| Поле | Значение |
|---|---|
| Build Pack | **Dockerfile** |
| Dockerfile Location | `infra/coolify/support-chat.Dockerfile` |
| Port | `8084` |
| Domains | `https://chat-api.mastersword.ru` |

Healthcheck: `GET https://chat-api.mastersword.ru/health`

### Environment (Runtime)

| Переменная | Значение |
|---|---|
| `OGC_TELEGRAM__PUBLIC_BASE_URL` | `https://chat-api.mastersword.ru` |
| `OGC_TELEGRAM__BOT_TOKEN` | token от @BotFather |
| `OGC_TELEGRAM__SUPPORT_CHAT_ID` | `-100...` (супергруппа) |
| `OGC_TELEGRAM__WEBHOOK_SECRET` | случайная строка (openssl rand -hex 32) |
| `OGC_POSTGRESQL__USERNAME` | пользователь Postgres |
| `OGC_POSTGRESQL__PASSWORD` | пароль |
| `OGC_POSTGRESQL__DB_HOST` | хост БД |
| `OGC_POSTGRESQL__DB_PORT` | `5432` |
| `OGC_POSTGRESQL__DBNAME` | имя БД (можно отдельная `mos_chat`) |
| `OGC_STORAGE__ACCESS_KEY` | S3 (Selectel) |
| `OGC_STORAGE__SECRET_KEY` | S3 |
| `OGC_STORAGE__BUCKET` | `mos-chat` |

При старте сервис **сам вызывает `setWebhook`** на  
`{OGC_TELEGRAM__PUBLIC_BASE_URL}/integrations/telegram/webhook/{SECRET}`.

Вручную (если нужно):

```sh
sh scripts/set-telegram-webhook.sh
```

### Web (Buildtime + Runtime)

```env
NEXT_PUBLIC_SUPPORT_CHAT_API=https://chat-api.mastersword.ru
NEXT_PUBLIC_SUPPORT_CHAT_WS=wss://chat-api.mastersword.ru
```

После деплоя support-chat — **Rebuild web** и пересобери виджет (`npm run chat:build` с prod URL) при смене API.

## S3 (из GFF / Selectel)

Те же имена, что в `L:\GFF\GFF`:

```env
S3_ENDPOINT=https://s3.ru-7.storage.selcloud.ru
S3_REGION=ru-7
S3_ACCESS_KEY=...
S3_SECRET_KEY=...
S3_BUCKET=...
# S3_PUBLIC_BASE_URL=https://your-bucket.selstorage.ru
```

Ключи: панель Selectel → Объектное хранилище → S3-ключи.  
Документация SDK: https://developers.selectel.com/docs/cloud-services/cloud-storage/s3/aws_sdk/

> Эти переменные нужны сервису **school-api** для загрузки аватаров (`POST /v1/profile/avatar` — multipart → PutObject в S3).  
> Обязательно задай `S3_PUBLIC_BASE_URL` (публичный HTTPS бакета Selectel), иначе в профиле сохранится path-style URL.  
> Браузер больше не ходит в S3 напрямую, поэтому CORS бакета для аватаров не обязателен.

## Чеклист

1. Задеплой `school-api`, получи публичный HTTPS URL.
2. В web пропиши `NEXT_PUBLIC_SCHOOL_API=https://...` и пересобери.
3. Открой `/login` → `admin@mastersword.ru` / `admin123`.
4. S3-ключи добавь Runtime-переменными (секреты не в Git).

## Выгрузка hero-видео на S3 (Coolify Terminal)

В сервисе **web** (где уже заданы `S3_*`) выполни:

```sh
sh scripts/coolify-upload-hero-s3.sh
```

Скрипт зальёт `apps/web/public/media/hero/*` в бакет с префиксом `media/hero/` и напечатает:

```env
# Пока нет рабочего публичного домена Selectel — отдавай с самого сайта:
NEXT_PUBLIC_MEDIA_BASE_URL=/media/hero

# Или UUID-домен из панели Selectel (НЕ имя бакета):
# NEXT_PUBLIC_MEDIA_BASE_URL=https://<bucket-uuid>.selstorage.ru/media/hero
```

Для Selectel публичный URL — `https://<bucket-uuid>.selstorage.ru/<key>` **без** повторного имени бакета в пути.

Частые ошибки (видео в hero «не играют»):
- `https://swordmaster.selstorage.ru/...` — **имя бакета ≠ публичный хост**, DNS = NXDOMAIN.
- `...selstorage.ru/<bucket>/media/hero` — лишний сегмент `/<bucket>/` → 404.
- Переменная задана только Runtime без Rebuild — Next.js вшивает `NEXT_PUBLIC_*` на **Buildtime**.

Проверка: `curl -I https://<host>/media/hero/1.mp4` должен дать `200` и `Content-Type: video/mp4`.
Пока S3-публичный домен не открывается — ставь `/media/hero` (файлы уже в образе web).

Добавь `NEXT_PUBLIC_MEDIA_BASE_URL` в web (**Buildtime + Runtime**) и сделай **Rebuild**.

Иконки заданий / достижений / талантов — та же схема:

```env
NEXT_PUBLIC_CONTENT_ICONS_BASE_URL=/media/content-icons
# или https://<bucket-uuid>.selstorage.ru/media/content-icons
```

`swordmaster.selstorage.ru` здесь тоже нельзя — в коде такой хост игнорируется и берётся `/media/content-icons`.

## Автодеплой не стартует

Git-пуши в **`main`**. Локально `pnpm --filter @mos/web build` проходит.

Если **Redeploy вручную работает**, а после push в GitHub деплой не появляется — проблема в **webhook**.

### Починить webhook (Coolify + GitHub)

1. **Coolify → Configuration → Git Source**
   - Repository: `IlyaCheh1/Progression-platform`
   - Branch: **`main`**
   - Нажми **Reconnect** / **Refresh** (перепривязать GitHub).

2. **Coolify → Configuration → Webhooks**
   - Скопируй **Deploy Webhook URL** (или UUID deploy hook).
   - Это URL, который должен быть в GitHub.

3. **GitHub → репозиторий → Settings → Webhooks**
   - Найди webhook на Coolify (или **Add webhook**).
   - **Payload URL** = URL из шага 2 (точное совпадение, без лишнего `/`).
   - **Content type**: `application/json`.
   - **Events**: «Just the push event» (или push + ping).
   - Сохрани. Coolify должен ответить на **Ping** кодом **200**.

4. **GitHub → Settings → Applications → Installed GitHub Apps → Coolify → Configure**
   - У приложения есть доступ к **`Progression-platform`** (All repositories или этот repo в списке).

5. **Проверка**
   - В GitHub Webhooks → выбери webhook → **Recent Deliveries**.
   - Push в `main` → delivery **200**. Если **4xx/5xx** — скопируй Response и поправь URL/секрет.
   - Можно **Redeliver** последний push и смотреть, появился ли деплой в Coolify → Deployments.

6. **Coolify server**
   - Инстанс Coolify доступен с интернета по HTTPS (GitHub шлёт webhook снаружи).
   - После смены домена/IP старый webhook в GitHub перестаёт работать — нужен новый URL из п. 2.

### Остальное

- **Advanced → Auto Deploy** — включён.
- **Deployments** — нет зависшего «In Progress».

Репозиторий: `IlyaCheh1/Progression-platform`, пушить только в **`main`**.
