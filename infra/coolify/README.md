# Coolify: что задать для сайта

Минимум для работающего фронта с логином и админкой — **два сервиса**:

1. **web** (Next.js)
2. **school-api** (Go)

`auth-adapter` — только если нужна кнопка OnlyID.

Шаблон переменных: [`env.example`](./env.example).

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
