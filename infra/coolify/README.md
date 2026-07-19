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

## school-api

| Переменная | Значение |
|---|---|
| `SCHOOL_API_ADDR` | `0.0.0.0:8082` |

Без этого контейнер останется на loopback и снаружи не откроется.

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

Git-пуши уже в **`main`** (и синхронизированы с `master`). Локально `pnpm --filter @mos/web build` проходит.

Если после push в GitHub деплой в Coolify **не появляется**:

1. **Source → Branch** — должна быть **`main`** (не `master`, не `7a9938b`).
2. **Auto Deploy** — включён (Deploy on push).
3. **GitHub → Settings → Webhooks** — webhook Coolify есть, последняя доставка **200** (не 4xx/5xx).
4. Если webhook красный — в Coolify: **Source → Reconnect** / заново привязать репозиторий.
5. **Deployments** — нет ли зависшего «In Progress» (отмени и **Redeploy**).
6. Ручной **Redeploy** с веткой `main` и коммитом `4d7c0a3` или новее — если работает, проблема только в webhook.

Репозиторий: `IlyaCheh1/Progression-platform`, актуальный коммит на `main`: см. GitHub → Commits.
