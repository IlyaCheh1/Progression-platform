# Coolify: что задать для сайта

Минимум для работающего фронта с логином и админкой — **два сервиса**:

1. **web** (Next.js)
2. **school-api** (Go)

`auth-adapter` — только если нужна кнопка OnlyID.

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
| `NEXT_PUBLIC_AUTH_URL` | да* | build + runtime |
| `NEXT_PUBLIC_PLATFORM_API` | нет | можно сразу |
| `NEXT_PUBLIC_SITE_URL` | нет | рекомендуется |

\*Если OnlyID не используешь — всё равно задай валидный URL или оставь заглушку; основная авторизация идёт через `school-api`.

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

### Environment

| Переменная | Значение |
|---|---|
| `SCHOOL_API_ADDR` | `0.0.0.0:8082` |

Без `0.0.0.0` API слушает только loopback внутри контейнера и снаружи недоступен.

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

> В текущем коде MoS эти переменные ещё не подключены к runtime. Задай их в Coolify заранее — когда появятся аплоады, переиспользовать те же имена, что в GFF.

## Чеклист

1. Задеплой `school-api`, получи публичный HTTPS URL.
2. В web пропиши `NEXT_PUBLIC_SCHOOL_API=https://...` и пересобери.
3. Открой `/login` → `temp.admin@masterofsword.local` / `MoS-Temp-PlatformAdmin-2026!`.
4. S3-ключи добавь Runtime-переменными (секреты не в Git).

## Выгрузка hero-видео на S3 (Coolify Terminal)

В сервисе **web** (где уже заданы `S3_*`) выполни:

```sh
sh scripts/coolify-upload-hero-s3.sh
```

Скрипт зальёт `apps/web/public/media/hero/*` в бакет с префиксом `media/hero/` и напечатает:

```env
NEXT_PUBLIC_MEDIA_BASE_URL=https://.../media/hero
```

Добавь эту переменную в web (Buildtime + Runtime) и сделай **Rebuild**.

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
