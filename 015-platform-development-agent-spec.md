---
document: 015-platform-development-agent-spec
title: Техническое задание для агента разработки Progression Platform
owner: Platform Team
status: Proposed
version: 0.1.0
last_updated: 2026-07-19
depends_on:
  - 000-product-philosophy
  - 001-domain-definition
  - 002-platform-architecture
  - 002a-platform-contract-standard
  - 002b-cross-engine-integration
  - 003-character-engine
  - 004-progression-engine
  - 004a-standard-level-profile
  - 005-reward-engine
  - 006-achievement-engine
  - 007-quest-engine
  - 008-talent-engine
  - 009-item-engine
  - 010-inventory-engine
  - 011-season-engine
  - 012-context-module-framework
  - 014-partner-content-studio
  - school-fencing-module-readme
  - school-fencing-module-architecture
  - school-fencing-functional-capabilities
  - school-fencing-domain-model-events
  - school-fencing-progression-mastery
  - school-fencing-content-pack
  - school-fencing-integrations-data
  - school-fencing-delivery-roadmap
  - school-fencing-excel-migration-notes
---

# Техническое задание для агента разработки Progression Platform

## 1. Назначение документа

Этот документ является исполнимым implementation brief для coding-агента,
который должен разработать Progression Platform, весь необходимый backend,
пользовательские интерфейсы и первый production Context Module
school.fencing.

Агент получает:

- нормативные документы платформы;
- документы модуля школы фехтования;
- референсный репозиторий визуальных стилей и компонентов;
- референсный репозиторий системы авторизации;
- референсный репозиторий чата поддержки;
- референсный репозиторий или реализацию RPG-профиля OnlyGames;
- подключённый MCP Higgsfield для генерации изображений;
- доступные sandbox credentials и provider adapters, когда они будут выбраны.

Цель агента — не создать демонстрационный макет, а последовательно довести
платформу до проверяемого production-ready состояния в границах утверждённых
фаз.

## 1.1. Нормативные формулировки

- ДОЛЖЕН — обязательное требование;
- НЕ ДОЛЖЕН — запрещённое решение;
- СЛЕДУЕТ — рекомендуемое решение, отклонение фиксируется ADR;
- МОЖЕТ — допустимая возможность.

Все пункты Definition of Done и обязательные E2E являются release gates.

Агент создаёт docs/acceptance-traceability.md и присваивает атомарным задачам
идентификаторы DEV-S<номер раздела>-<порядковый номер>. Каждая строка связывает:

- источник требования;
- реализационный package;
- миграцию;
- API/Event contract;
- автоматический тест;
- evidence;
- статус.

-------------------------------------------------------------------------

# 2. Роль и ответственность агента

Агент выступает одновременно как:

- lead software architect;
- senior backend engineer;
- senior frontend engineer;
- database engineer;
- integration engineer;
- test automation engineer;
- DevOps engineer в пределах локальной и согласованной инфраструктуры;
- technical writer.

Агент отвечает за:

1. анализ всех источников;
2. обнаружение противоречий;
3. фиксацию решений через ADR;
4. проектирование репозитория;
5. реализацию;
6. миграции данных;
7. автоматические тесты;
8. локальную среду;
9. документацию API и событий;
10. безопасность;
11. наблюдаемость;
12. release и rollback процедуры;
13. демонстрационные сценарии;
14. отчёт о готовности.

Агент не должен ограничиваться генерацией каркаса, моков или TODO, если
реализация не заблокирована внешним провайдером, отсутствующим решением или
полномочиями.

-------------------------------------------------------------------------

# 3. Иерархия источников истины

При конфликте используется следующий приоритет:

1. Product Philosophy и Domain Definition.
2. Platform Architecture и contract standards.
3. Engine RFC.
4. Context Module Framework.
5. Partner Content Studio.
6. Документы school.fencing.
7. Утверждённые ADR реализации.
8. Референсные репозитории.
9. Существующий код, если он противоречит более высокому источнику.

Референсный код никогда автоматически не становится архитектурной нормой.

Если два нормативных документа противоречат друг другу, агент:

1. не маскирует конфликт локальным workaround;
2. создаёт запись в docs/decisions/open-conflicts.md;
3. указывает документы и затронутые инварианты;
4. предлагает безопасный вариант;
5. запрашивает решение только если варианты существенно меняют продукт,
   безопасность, деньги или необратимую модель данных;
6. после решения создаёт ADR и обновляет зависимые тесты.

-------------------------------------------------------------------------

# 4. Референсные репозитории

## 4.1. Входной манифест

Перед реализацией агент заполняет docs/reference-intake.md:

| Роль | Placeholder |
|---|---|
| UI styles/design system | примеры блоков и стилей L:\OG\og-market-frontend-main / компоненты в фигма - https://www.figma.com/design/saOpJJa5gD6VUqNbF5MN8q/Web-Components?node-id=40000294-1159&t=JfwQVtHCqFH1NOUg-1 / лендинг полностью по стилям копируем отсюда  - L:\OG-landing | 
| Authentication | https://git.onlygames.ru/og-sso/backend |
| Support chat | L:\tmp-og-chat |
| OnlyGames RPG profile | https://git.onlygames.ru/og-main/backend и L:\OG\og-profile-frontend |

Для каждого репозитория фиксируются:

- URL или локальный путь;
- pinned commit SHA;
- лицензия;
- язык и framework;
- package manager;
- команды запуска и тестов;
- архитектурные модули;
- reusable packages;
- runtime dependencies;
- env variables;
- внешние providers;
- схема данных;
- security findings;
- что переиспользуется;
- что адаптируется;
- что не переносится;
- миграционный риск.

## 4.2. Обязательный аудит

Агент должен:

1. запустить каждый репозиторий локально;
2. выполнить существующие тесты;
3. проверить lint и typecheck;
4. изучить структуру пакетов;
5. составить dependency и license inventory;
6. проверить наличие секретов и unsafe defaults;
7. снять карту пользовательских сценариев;
8. определить точки интеграции;
9. подготовить ADR о стратегии переиспользования.

Копирование каталогов целиком без аудита запрещено.

## 4.3. Референс стилей

Из UI-репозитория следует переиспользовать, если лицензия и качество позволяют:

- design tokens;
- typography;
- color system;
- spacing;
- responsive breakpoints;
- базовые controls;
- form patterns;
- table and filter patterns;
- navigation;
- modal and drawer behavior;
- loading, error и empty states;
- accessibility helpers.

Нельзя переносить:

- чужие доменные сущности;
- hardcoded tenant branding;
- реальные пользовательские данные;
- устаревшие auth assumptions;
- компоненты, нарушающие WCAG;
- стили, конфликтующие с privacy или minors requirements.

## 4.4. Референс авторизации

Auth-репозиторий является реализационным референсом. Он должен быть приведён к
модели платформы:

- User не равен Character;
- Character не принадлежит Module;
- Student и Guardian являются business identities школы;
- staff roles tenant-scoped;
- service actors имеют отдельные identities;
- admin и publishing operations используют MFA;
- session, refresh, revocation и device policy аудируются;
- cross-tenant identity leakage запрещён.

Если auth-референс не поддерживает эти свойства, агент реализует adapter или
заменяет несовместимую часть через ADR.

## 4.5. Референс чата поддержки

Следует сохранить удачные UX и transport patterns, но чат:

- не становится авторитетным владельцем CRM;
- не исполняет privileged commands из текста;
- не меняет progression или payments напрямую;
- создаёт typed support case или approved command request;
- применяет tenant и role access;
- скрывает данные несовершеннолетних;
- имеет retention, export и deletion policy;
- хранит attachment metadata безопасно;
- аудирует staff access;
- поддерживает escalation и handoff.

## 4.6. Референс RPG-профиля OnlyGames

OnlyGames используется как:

- визуальный и UX-референс Character profile;
- источник проверенных presentation patterns;
- источник идей для Quest, Achievement, Item, Reward и notification UX;
- материал для migration mapping.

Он не является источником авторитетной backend-модели. Старые поля, формулы,
идентификаторы и связи переносятся только через mapping в Engine Definitions.

-------------------------------------------------------------------------

# 5. Протокол работы coding-агента

## 5.1. Перед изменениями

Агент:

1. читает AGENTS.md и repository instructions;
2. проверяет состояние worktree;
3. не уничтожает пользовательские изменения;
4. строит карту monorepo;
5. запускает текущие проверки;
6. обновляет implementation plan;
7. определяет минимальный вертикальный slice.

## 5.2. Во время работы

- изменения выполняются небольшими проверяемыми пакетами;
- каждая capability имеет owner и тестируемую границу;
- каждый новый contract имеет schema и fixtures;
- каждая миграция имеет forward и recovery plan;
- каждое внешнее действие использует sandbox или mock до получения production
  authority;
- существенное архитектурное решение фиксируется ADR;
- прогресс обновляется в docs/implementation-status.md;
- незавершённая функция скрыта feature flag и не объявляется готовой.

## 5.3. Запрещённое поведение

Агент не должен:

- переписывать нормативные документы под случайный код;
- обходить Engine через прямые database writes;
- хранить секреты в Git;
- использовать production user data в dev;
- автоматически развёртывать production без явного разрешения;
- подключать платный provider без согласования;
- делать force push;
- удалять пользовательские файлы;
- оставлять critical security warning без фиксации;
- считать визуальный mock завершённой backend-функцией;
- создавать фальшивую интеграцию, возвращающую hardcoded success;
- подменять Event-driven процесс синхронной цепочкой database mutations.

-------------------------------------------------------------------------

# 6. Целевой результат

В результате должны существовать:

- production-capable platform backend;
- platform web/API surfaces;
- school.fencing modular monolith;
- public school website;
- Student cabinet;
- Guardian cabinet;
- Coach cabinet;
- School Admin/CRM;
- Partner Content Studio;
- Character/RPG profile;
- support chat;
- payment, messaging и calendar adapters;
- content catalog и initial school content;
- migration pipeline из Excel;
- local development environment;
- CI/CD;
- observability;
- security controls;
- complete automated test suite;
- deployment и rollback documentation.

Полный backend означает полный backend активного каталога платформы и
school.fencing. Он не означает преждевременную реализацию неподтверждённых
Engine.

До отдельного RFC, owner и ADR не реализуются:

- Currency Engine;
- Reputation Engine;
- generic Leaderboard Engine;
- Marketplace/Trading;
- произвольный Entitlement Engine;
- loot box mechanics.

Registry должен отклонять неизвестные Component Types и не подменять
отсутствующий owner generic-таблицей.

-------------------------------------------------------------------------

# 7. Стратегия физической архитектуры

## 7.1. Первый production release

Первая версия использует ограниченное число deployable units, а не отдельный
network service на каждый Engine.

Рекомендуемая топология:

| Unit | Содержимое |
|---|---|
| Web | public site, cabinets, RPG profile, Studio UI |
| Platform API | Engine commands, queries, authoring и composition BFF |
| Platform Workers | inbox/outbox, timers, reward fulfillment, projections |
| School API | identity, CRM, scheduling, booking, commerce, training, mastery |
| School Workers | integrations, timers, communications, migration jobs |
| Auth | reference implementation или adapter, если требует отдельного unit |
| Support Chat | отдельный unit только если reference architecture требует |

Platform Engine остаются логически независимыми модулями с отдельным schema
ownership, repositories, commands, events, migrations и tests.

School Module является modular monolith с capability boundaries, указанными в
school-fencing-module-architecture.

## 7.2. Извлечение сервиса

Capability выделяется в отдельный network service только при наличии:

- измеренного отдельного scaling profile;
- отдельной security или regulatory boundary;
- независимого release cadence;
- выраженной team ownership;
- failure isolation requirement;
- неприемлемого contention после оптимизации;
- ADR с migration и rollback plan.

-------------------------------------------------------------------------

# 8. Выбор технологического стека

## 8.1. Правило выбора

Агент сначала анализирует референсные репозитории и создаёт
ADR-001-implementation-stack.md.

Если референсы не задают согласованный production-capable стек, используется
базовый кандидат:

- TypeScript strict mode;
- актуальный Node.js LTS;
- pnpm workspace;
- React и Next.js для web;
- NestJS с Fastify adapter или эквивалентный typed backend framework;
- PostgreSQL;
- Redis только для bounded cache, locks или queue, но не как источник истины;
- S3-compatible object storage;
- transactional outbox;
- durable message broker для cross-unit events;
- OpenAPI;
- AsyncAPI или equivalent event catalog;
- JSON Schema;
- OpenTelemetry;
- Docker Compose для local environment;
- контейнерный production deployment;
- infrastructure as code.

Любое отклонение допустимо, если:

- совместимо со всеми инвариантами;
- снижает миграционные затраты;
- имеет поддерживаемую security модель;
- покрыто ADR;
- не создаёт vendor lock без необходимости.

## 8.2. Неподлежащие компромиссу свойства

Независимо от стека обязательны:

- строгая типизация контрактов;
- migration discipline;
- optimistic concurrency;
- idempotency;
- inbox/outbox;
- immutable Events;
- tenant isolation;
- audit;
- automated tests;
- reproducible local environment;
- versioned API и schema;
- no float для authoritative Experience, mastery и money.

-------------------------------------------------------------------------

# 9. Предлагаемая структура monorepo

Точная структура утверждается ADR, но должна отражать границы:

    apps/
      web/
      platform-api/
      platform-worker/
      school-api/
      school-worker/
      auth/
      support-chat/
    packages/
      ui/
      design-tokens/
      auth-client/
      contracts/
      event-envelope/
      observability/
      testing/
      content-sdk/
      higgsfield-assets/
    platform/
      character/
      progression/
      reward/
      achievement/
      quest/
      talent/
      item/
      inventory/
      season/
      control-plane/
      content-studio/
    modules/
      fencing-school/
        identity/
        crm/
        scheduling/
        booking/
        commerce/
        training/
        mastery/
        communications/
        content-marketing/
        analytics/
        integration/
    schemas/
      events/
      commands/
      api/
      content/
    docs/
      adr/
      api/
      runbooks/
      implementation-status.md
      reference-intake.md
    infra/
      local/
      environments/
      monitoring/

Package dependency rules проверяются автоматически. Module может зависеть от
platform client contracts, но Engine не зависит от school module.

-------------------------------------------------------------------------

# 10. Общая backend-платформа

До реализации игровых механик агент создаёт shared foundation.

## 10.1. Identity primitives

- UUIDv7 или другой утверждённый time-sortable UUID;
- stable external reference mapping;
- tenantId;
- realmKey;
- moduleKey;
- Character ID;
- User ID;
- actor identity;
- service principal;
- correlation и causation IDs.

## 10.2. Command infrastructure

Каждый Command содержит:

- commandId;
- commandType;
- schemaVersion;
- actor;
- tenant и realm;
- target aggregate;
- expectedVersion;
- idempotencyKey;
- occurred/requested time;
- reason для privileged command;
- payload.

Обязательны:

- authentication;
- authorization;
- validation;
- deduplication;
- aggregate locking;
- atomic state plus ledger plus outbox commit;
- typed result;
- stable error code;
- audit.

## 10.3. Event infrastructure

Реализовать canonical Event envelope из contract standard:

- immutable Event;
- schema registry;
- producer identity;
- occurredAt и recordedAt;
- subject;
- aggregate identity и version;
- partition key;
- tenant и realm;
- correlation, causation и lineage;
- data classification;
- replay metadata;
- payload schema.

## 10.4. Inbox/outbox

Для каждого writer:

- transactional outbox;
- durable publisher;
- consumer inbox;
- logical deduplication;
- retry с backoff;
- dead-letter/quarantine;
- replay;
- reconciliation;
- metrics;
- support inspection.

Exactly-once transport не требуется. Exactly-once logical effect обязателен.

## 10.5. Definition infrastructure

Общий authoring pattern:

- stable Definition;
- editable Draft;
- validation report;
- approval;
- immutable Definition Version;
- publication;
- schedule;
- activation;
- retirement;
- archive;
- exact version lookup;
- content hash;
- dependency graph;
- rollback through activation change.

Engine сохраняет собственные authoritative Definition rows.

## 10.6. Audit

Append-only audit связывает:

- actor;
- tenant;
- command;
- aggregate;
- before/after;
- reason;
- approvals;
- source Event;
- resulting Events;
- exact Definition versions;
- support access;
- export;
- rollback.

-------------------------------------------------------------------------

# 11. Character Engine

Реализовать RFC полностью в объёме MVP.

Обязательный scope:

- Character creation и lifecycle;
- User association;
- Module Association;
- profile presentation;
- visibility и discoverability;
- entitlement projections;
- selected avatar, title, frame, theme и badge;
- privacy;
- closure и anonymization;
- audit;
- safe public projection.

Запрещено хранить в Character:

- школьное membership;
- CRM stage;
- payment status;
- attendance;
- authoritative Level;
- Inventory ownership;
- guardian contact;
- medical data.

Frontend Character profile собирается из Character projection плюс read models
Progression, Achievement, Quest, Inventory, Talent и Season.

-------------------------------------------------------------------------

# 12. Progression Engine

Обязательный scope:

- multiple Progression Tracks;
- standard primary Level 1–100;
- positive Experience grants;
- ledger;
- idempotent fulfillment;
- Level derivation;
- Level transitions;
- caps;
- reversals и administrative correction;
- migrations;
- seasonal pass Tracks;
- history;
- explainability.

Стандартная primary curve загружается из
004a-standard-level-profile и не редактируется партнёром.

Battle Pass использует отдельный Track. Pass Experience не смешивается с
primary Experience и не переживает Edition через silent reset.

-------------------------------------------------------------------------

# 13. Reward Engine

Обязательный scope:

- Reward Definition;
- Reward Trigger Binding;
- bounded condition expressions;
- repeatability;
- Grant saga;
- auto и manual claim;
- Component fulfillment;
- EXPERIENCE;
- ITEM;
- зарегистрированные Talent/Entitlement components;
- partial failure;
- retry;
- compensation;
- revocation;
- manual support workflow;
- caps;
- authoring validation;
- dependency graph;
- audit.

Reward Engine не пишет Progression, Inventory или Talent state. Он отправляет
typed fulfillment request владельцу и фиксирует результат.

Для payment Events default XP binding отсутствует.

-------------------------------------------------------------------------

# 14. Quest Engine

Обязательный scope:

- Quest Definition и Edition;
- Campaign;
- chapter и chain;
- Objective;
- objective groups ALL/ANY;
- optional objectives;
- prerequisites;
- eligibility;
- recurrence;
- availability;
- assignment;
- progress;
- completion;
- expiry;
- correction;
- reward request;
- hidden content;
- history;
- authoring и simulation.

Quest progress обновляется только по зарегистрированным Events и Commands.

-------------------------------------------------------------------------

# 15. Achievement Engine

Обязательный scope:

- Achievement Definition;
- multi-tier Achievement;
- conditions;
- prerequisites;
- counters;
- hidden Achievement;
- permanent unlock record;
- integrity invalidation без destructive deletion;
- recognition;
- optional Reward;
- correction and replay;
- explainability.

Оружейные ранги моделируются как восемь tiered definitions или утверждённый
эквивалент, а не как неструктурированный набор badge rows.

-------------------------------------------------------------------------

# 16. Item и Inventory Engines

## 16.1. Item Engine

- Item Definition;
- immutable versions;
- registered Item Types;
- capability registry;
- presentation;
- assets;
- lifecycle;
- catalog;
- exact lookup.

Школьный allowlist:

- COSMETIC;
- TROPHY;
- COLLECTIBLE;
- ACCESS_TOKEN;
- CONSUMABLE;
- QUEST_ITEM.

## 16.2. Inventory Engine

- holdings;
- unique и stackable Items;
- acquisition;
- consumption;
- reservation;
- expiry;
- equipment/presentation entitlement projection;
- duplicate policy;
- reversal;
- immutable ledger;
- history.

Физическая награда не считается доставленной по факту наличия цифрового Item.

Title реализуется как COSMETIC Item subtype TITLE. Inventory владеет правом,
Character хранит выбранную presentation reference.

-------------------------------------------------------------------------

# 17. Talent Engine

Обязательный Phase 2 scope:

- Talent Tree;
- nodes и ranks;
- prerequisites;
- Talent resources;
- Talent unlock;
- registered effects;
- loadout;
- cooldown;
- effect-set projections;
- reward fulfillment;
- reversal;
- versioning.

School Talent не должен:

- стимулировать небезопасную нагрузку;
- давать платное функциональное преимущество;
- заменять подтверждение тренера;
- обходить XP caps.

-------------------------------------------------------------------------

# 18. Season Engine

Обязательный scope:

- Season Definition и Version;
- Edition;
- Manifest;
- phases и windows;
- schedule revisions;
- trusted time;
- participation;
- eligibility;
- enrollment;
- content bindings;
- pause;
- close;
- grace;
- lateness;
- settlement;
- finalization;
- cancellation и termination;
- simulation;
- reconciliation.

Season Engine владеет временем и participation, но не Quest progress, seasonal
Experience, Rewards или Items.

-------------------------------------------------------------------------

# 19. Battle Pass

Battle Pass реализуется как compiler-backed Blueprint в Partner Content Studio.

Публикация создаёт:

- точную Season Edition binding;
- отдельный Progression Track;
- tiers;
- free lane;
- optional premium cosmetic lane;
- Reward Definitions;
- Pass XP source bindings;
- Quest bindings;
- claim и grace policy;
- Entitlement reference;
- release bundle.

Обязательные свойства:

- free lane существует всегда;
- thresholds целочисленные и возрастающие;
- pass progress принадлежит Progression Engine;
- время принадлежит Season Engine;
- rewards принадлежат Reward Engine;
- premium entitlement принадлежит Commerce/Entitlement owner;
- покупка не начисляет pass XP;
- school premium не выдаёт primary XP, mastery или functional Talent;
- late join и retroactive premium claims определены;
- закрытие не удаляет полученные награды;
- bundle активируется атомарно с точки зрения selection.

-------------------------------------------------------------------------

# 20. Control Plane

Реализовать:

- Event Schema Registry;
- Reward Component Registry;
- Item Type/Capability Registry;
- Talent Effect Registry;
- Module Manifest Registry;
- producer identities;
- exact immutable reference validation;
- global dependency graph;
- cycle detection;
- release bundle compiler;
- activation orchestration;
- acknowledgements;
- kill switches;
- audit;
- operational inspection.

Control Plane координирует, но не становится владельцем Engine Definitions.

-------------------------------------------------------------------------

# 21. Partner Content Studio

Реализовать 014-partner-content-studio.

MVP editors:

- Quest/Campaign;
- Achievement;
- Reward;
- Item;
- Title;
- Collection/Skin Set;
- Season;
- Battle Pass;
- Level Milestone;
- Mastery Recognition;
- Notification presentation;
- assets;
- localization;
- release bundle.

Обязательные функции:

- create from template;
- clone;
- autosave;
- typed forms;
- no-code Rule Builder;
- dependency graph;
- version diff;
- XLSX/CSV/JSON/YAML import;
- validation;
- student/guardian preview;
- synthetic simulation;
- comments;
- approval;
- scheduling;
- publish;
- pause;
- rollback;
- audit;
- content health.

Контент школы импортируется через Studio/authoring API, а не hardcode seed,
обходящий validation.

-------------------------------------------------------------------------

# 22. School Module backend

School Module реализуется modular monolith.

## 22.1. School Identity

- Person;
- Student Profile;
- Guardian relationship;
- staff identity;
- renter;
- contact encryption;
- consent evidence;
- external identity mapping;
- Character Association requests;
- closure и deletion workflows.

## 22.2. CRM

- Lead;
- source/UTM;
- funnel stages;
- trial;
- tasks;
- tags;
- communication timeline;
- conversion;
- at-risk state;
- no automatic negative game consequence.

## 22.3. Scheduling

- venues;
- halls;
- groups;
- recurring sessions;
- instructors;
- resource reservations;
- maintenance/block;
- capacity;
- half-open intervals;
- timezone;
- schedule revisions;
- conflict detection;
- export.

Одна модель ресурсов обслуживает занятия, пробные, аренду, события и блокировки.

## 22.4. Booking

- trial booking;
- class booking;
- rental request;
- event booking;
- capacity;
- waitlist;
- cancellation;
- reschedule;
- atomic claim;
- confirmation;
- attendance link.

## 22.5. Commerce

- Offer;
- Order;
- Payment Attempt;
- Payment;
- Refund;
- fiscal receipt reference;
- Membership;
- family allocation;
- proration;
- freeze;
- reconciliation;
- provider webhook;
- idempotency.

Money хранится в minor units. Card data не хранится.

## 22.6. Training

- attendance;
- coach confirmation;
- immutable revisions;
- exercise catalog;
- equipment specifications;
- training records;
- verification;
- correction;
- void;
- safe Events.

Coach должен подтверждать attendance максимум в двух основных взаимодействиях.

## 22.7. Weapon Mastery

Реализовать точную математику из
school-fencing-progression-mastery:

- восемь tracks;
- integer load units;
- распределение 75/25;
- monthly d8 bonus;
- daily decay;
- trusted local day;
- active track rules;
- ranks 0–10;
- earned-rank floor;
- immutable ledger;
- rank transition Events;
- correction/recalculation;
- private explainability.

Запрещён authoritative float.

## 22.8. Communications

- template;
- channel consent;
- Telegram;
- SMS fallback;
- email where appropriate;
- dispatch;
- retry;
- delivery status;
- quiet hours;
- reminder schedules;
- campaign plan Phase 2;
- no business decision inside template renderer.

В MVP School Communications является владельцем доставки школьных и
presentation-safe platform notifications. Если после появления второго Context
Module потребуется общий Notification Engine, он выделяется только после
отдельного RFC и ADR. До этого нельзя создавать второй скрытый notification
ledger в frontend или Content Studio.

## 22.9. Content and Marketing

- public pages;
- direction landing pages;
- trainer and hall presentation;
- blog;
- SEO;
- UTM persistence;
- media references;
- campaign page templates.

CMS content не является Engine Definition.

## 22.10. Analytics

- active students;
- revenue;
- average receipt;
- funnel;
- occupancy;
- trainer compensation projection;
- churn;
- attribution;
- game health;
- reward rate;
- Quest completion;
- mastery corrections;
- data freshness.

Analytics projection не становится источником транзакционной истины.

## 22.11. Platform Adapter

- Module Manifest;
- producer identity;
- Event schemas;
- Character association;
- outbox;
- inbox;
- mapping;
- reconciliation;
- replay;
- safe data minimization.

-------------------------------------------------------------------------

# 23. Frontend surfaces

## 23.1. Public site

- home;
- directions;
- trainers;
- halls;
- schedule;
- trial booking;
- tariffs;
- rental;
- events;
- contacts/map;
- reviews;
- blog;
- SEO;
- responsive performance;
- consent;
- UTM.

## 23.2. Student cabinet

- upcoming sessions;
- membership;
- payments and receipts;
- Level 1–100;
- XP explanation;
- eight mastery tracks;
- decay forecast;
- active Quests;
- Achievements;
- Inventory;
- selected cosmetics;
- Season;
- Battle Pass;
- support chat;
- privacy and notifications.

## 23.3. Guardian cabinet

- authorized dependants;
- schedules;
- payments;
- consent;
- age-appropriate progression;
- no unrestricted private social profile.

## 23.4. Coach cabinet

- assigned sessions;
- roster;
- attendance;
- structured training entry;
- validation of unusual values;
- correction workflow;
- own compensation projection only.

## 23.5. Administrator

- CRM;
- scheduling;
- booking;
- commerce;
- imports;
- communications;
- corrections;
- provider failures;
- reports;
- support cases.

Game changes выполняются approved workflows, не database editing.

## 23.6. Partner Content Studio

Реализуется как tenant-scoped admin surface из раздела 21.

## 23.7. Character profile

Использовать OnlyGames как presentation reference, сохранив:

- Character identity;
- Level;
- progress bar;
- title;
- avatar;
- frame/theme;
- Achievement showcase;
- Inventory;
- active Quest;
- Season/Pass;
- notification receipts.

Authoritative данные поступают из Engine read models.

-------------------------------------------------------------------------

# 24. Authentication и authorization

Обязательные роли:

- Guest;
- Student;
- Guardian/Family Manager;
- Coach;
- Renter;
- Administrator;
- Content Author;
- Content Reviewer;
- Content Approver;
- Content Publisher;
- Owner;
- Support Operator;
- Service Actor;
- Platform Operator.

Требования:

- OIDC/OAuth2-compatible boundary;
- secure session cookies или утверждённый token flow;
- refresh rotation;
- session revocation;
- MFA для privileged roles;
- email/phone verification according to policy;
- service credentials rotation;
- tenant-scoped RBAC;
- fine-grained scopes;
- explicit guardian grants;
- deny by default;
- rate limits;
- brute-force protection;
- audit;
- CSRF и XSS protection;
- no auth secret in browser bundle.

RLS может использоваться как дополнительная защита, но не заменяет application
authorization.

-------------------------------------------------------------------------

# 25. Support Chat

Обязательный MVP:

- student/guardian conversation;
- operator inbox;
- tenant routing;
- unread state;
- message delivery;
- attachments with allowlist;
- escalation;
- business hours;
- support case link;
- staff notes separate from customer messages;
- audit;
- retention;
- privacy export/deletion;
- notification.

Чат может создавать typed support request:

- attendance correction review;
- payment issue;
- account/guardian issue;
- reward explanation;
- technical issue.

Он не может напрямую выполнить correction, refund, Reward или identity change.

-------------------------------------------------------------------------

# 26. Изображения и MCP Higgsfield

## 26.1. Разрешение

Все необходимые оригинальные изображения МОЖНО генерировать через подключённый
MCP Higgsfield.

Coding-агент должен использовать Higgsfield MCP на этапе производства
визуальных assets, когда отсутствует утверждённый готовый asset.

Допустимые категории:

- public site hero images;
- backgrounds;
- Character avatars;
- profile themes;
- frames;
- banners;
- Quest illustrations;
- Achievement badges;
- Item art;
- Title presentation;
- weapon emblems;
- rank seals;
- manuscript fragments;
- Season covers;
- Battle Pass maps and covers;
- empty states;
- support illustrations.

## 26.2. Процесс генерации

Для каждого набора:

1. создать visual brief;
2. взять design tokens и style direction из UI reference;
3. определить aspect ratio, dimensions и safe area;
4. сформировать prompt;
5. вызвать Higgsfield MCP;
6. проверить варианты;
7. отклонить unsafe или стилистически несовместимые результаты;
8. сохранить выбранный оригинал;
9. создать web-оптимизированные derivatives;
10. зарегистрировать Asset Revision в Studio;
11. добавить alt text и reduced-motion/static fallback;
12. привязать к Definition только immutable asset identity.

## 26.3. Provenance

Asset manifest хранит:

- assetKey;
- Higgsfield job/reference ID, если доступен;
- prompt или безопасный prompt fingerprint;
- generation date;
- model/preset, если доступен;
- author;
- review status;
- license/usage status;
- source reference;
- checksum;
- derivatives;
- content usage graph.

## 26.4. Ограничения

- Higgsfield MCP является design-time tool, не runtime dependency.
- Credentials никогда не попадают в frontend.
- Приложение не вызывает генерацию при обычном просмотре страницы.
- Нельзя генерировать узнаваемых реальных учеников без согласия.
- Нельзя использовать лица несовершеннолетних как синтетическую имитацию
  реального ученика.
- Запрещены gore, унижение, опасная техника, unsafe weapon handling и
  романтизация травм.
- Нельзя копировать защищённых персонажей, логотипы или стиль конкретного
  живого художника без прав.
- Нельзя подменять Higgsfield случайными изображениями из веб-поиска.
- Другой генератор изображений используется только после явного согласования.
- Изображение оружия не подтверждает допуск к физическому инвентарю.
- Все assets проходят human review.

Если Higgsfield MCP временно недоступен, агент продолжает backend и layout с
явно маркированными placeholders, фиксирует blocker и не подменяет финальные
assets случайными изображениями без согласования.

-------------------------------------------------------------------------

# 27. Контент и seed data

## 27.1. Основной контент

Использовать school-fencing-content-pack:

- 35 Quest Definitions;
- 2 Campaigns;
- 30 Achievement Definitions;
- 120 Achievement tiers/unlocks;
- 12 Reward Definitions;
- не менее 130 Item Definitions;
- 3 cosmetic sets;
- 12 Talent nodes;
- Season Definition;
- четыре Season Editions;
- восемь mastery tracks;
- Level milestone bindings.

Числа уточняются по exact catalog перед import.

## 27.2. Правило загрузки

- content создаётся через authoring API;
- проходит validation;
- проходит simulation;
- собирается в bundle;
- публикуется exact versions;
- seed script идемпотентен;
- повторный запуск не создаёт дубликаты;
- production seed не содержит test Characters.

## 27.3. Demo data

Создать synthetic fixtures:

- adult student;
- minor student;
- guardian;
- coach;
- admin;
- content author;
- renter;
- multiple attendance histories;
- corrections;
- mastery ranks;
- Season participation;
- Battle Pass progress.

Имена и контакты являются явно синтетическими.

-------------------------------------------------------------------------

# 28. Миграция Excel

Реализовать staging pipeline для двух исходных workbook и будущих файлов.

Этапы:

- file hash;
- sheet discovery;
- header mapping;
- row identity;
- student matching;
- weapon alias mapping;
- decimal-to-integer conversion;
- validation;
- ambiguous row quarantine;
- difference report;
- dry run;
- approval;
- import;
- provenance;
- replay-safe rerun.

Excel не становится runtime ledger.

Обязательные тесты:

- повторный import;
- изменённый файл с тем же именем;
- duplicate rows;
- unknown student;
- weapon alias;
- invalid numeric value;
- formula cell;
- hidden sheet;
- totals reconciliation.

-------------------------------------------------------------------------

# 29. API и BFF

## 29.1. API styles

- REST/JSON для public, cabinet и admin commands/queries;
- versioned endpoints;
- OpenAPI;
- canonical error envelope;
- cursor pagination;
- idempotency header;
- optimistic concurrency;
- bounded bulk API;
- signed upload flow;
- webhooks с signature verification;
- read composition через BFF.

GraphQL допускается только для read composition через ADR. Он не должен
обходить command ownership.

## 29.2. API contracts

Каждый endpoint имеет:

- purpose;
- role/scopes;
- tenant resolution;
- request schema;
- response schema;
- idempotency semantics;
- concurrency semantics;
- error codes;
- audit behavior;
- rate limit;
- examples;
- automated contract test.

## 29.3. Event contracts

Для каждого Event:

- producer;
- consumers;
- schema;
- compatibility;
- ordering;
- partition key;
- dedup identity;
- correction/reversal;
- privacy classification;
- retention;
- fixture;
- consumer-driven tests.

-------------------------------------------------------------------------

# 30. Database и persistence

## 30.1. Общие правила

- PostgreSQL является source of truth;
- schema per logical owner;
- migration per owner;
- foreign keys внутри owner;
- cross-owner references через immutable IDs, не cross-schema cascade;
- aggregate version;
- append-only ledgers;
- UTC timestamps;
- IANA timezone for policy;
- half-open intervals;
- integers for XP/mastery;
- minor units for money;
- no hard delete of published/audited state;
- encrypted sensitive fields;
- retention jobs;
- backup;
- restore tests.

## 30.2. Multi-tenancy

- tenantId на tenant-owned rows;
- application authorization;
- optional RLS defense;
- tenant included in unique indexes;
- tenant-safe cache keys;
- tenant-safe object paths;
- tenant-safe jobs;
- tenant-safe logs;
- negative cross-tenant tests.

## 30.3. Concurrency

Обязательны:

- optimistic aggregate version;
- database constraints;
- transactional locking where required;
- no-overlap constraints for hall reservations;
- idempotent provider webhook;
- atomic capacity claim;
- fenced scheduler jobs;
- unique logical operation IDs.

-------------------------------------------------------------------------

# 31. Security и privacy

Агент выполняет threat modeling минимум для:

- auth;
- tenant boundaries;
- guardian access;
- payment webhooks;
- support chat;
- file upload;
- admin publishing;
- hidden content;
- Higgsfield asset pipeline;
- spreadsheet import;
- event spoofing;
- reward amplification;
- replay;
- broken access control.

Обязательные меры:

- secret manager integration;
- env schema;
- least privilege database users;
- dependency scanning;
- SAST;
- container scanning;
- SBOM;
- rate limiting;
- input validation;
- output encoding;
- CSP;
- secure cookies;
- MFA;
- audit;
- encryption;
- backup access control;
- privacy export;
- deletion/anonymization;
- legal hold;
- retention.

Restricted data отсутствует в general Events и logs.

-------------------------------------------------------------------------

# 32. Testing strategy

## 32.1. Уровни тестирования

- unit tests доменной логики;
- property-based tests для формул и state machines;
- database integration tests;
- contract tests;
- consumer-driven Event tests;
- API tests;
- component tests;
- frontend accessibility tests;
- end-to-end tests;
- visual regression;
- load tests;
- security tests;
- backup/restore drill;
- migration rehearsal.

## 32.2. Обязательные инварианты

- duplicate Event не создаёт второй effect;
- retry не создаёт второй Grant;
- published Definition неизменяема;
- tenant не читает другой tenant;
- minor private by default;
- Reward не пишет foreign tables;
- Level соответствует threshold;
- no float in mastery;
- correction append-only;
- rollback не удаляет earned state;
- one hall cannot have overlapping blocking reservation;
- payment webhook idempotent;
- content cycle blocks activation;
- Battle Pass purchase does not grant pass XP;
- Simulation has no production effect.

## 32.3. Test data

- только synthetic;
- deterministic clocks;
- deterministic random seeds;
- fake provider adapters;
- no shared mutable fixture;
- explicit tenant;
- explicit timezone.

## 32.4. Quality gates

Pull request не проходит при:

- failing tests;
- type errors;
- lint errors;
- schema incompatibility;
- migration drift;
- unresolved high security issue;
- missing API docs;
- broken dependency rule;
- critical accessibility regression;
- bundle cycle;
- leaked secret.

-------------------------------------------------------------------------

# 33. Observability

## 33.1. Logs

Structured logs:

- traceId;
- correlationId;
- causationId;
- tenant-safe identifier;
- actor type;
- command/event type;
- aggregate;
- result code;
- latency;
- retry count.

PII, secrets, raw chat attachments, payment data и medical data не логируются.

## 33.2. Metrics

- API latency/error;
- DB pool;
- outbox lag;
- inbox duplicate;
- dead letters;
- reward fulfillment;
- projection lag;
- timer lag;
- booking conflicts;
- payment reconciliation;
- messaging delivery;
- Quest completion;
- content activation;
- import errors;
- support queue;
- Higgsfield asset workflow failures, только design environment.

## 33.3. Traces

Trace должен связывать:

    school attendance
      -> outbox
      -> Reward decision
      -> EXPERIENCE fulfillment
      -> Progression ledger
      -> Level event
      -> cabinet projection

## 33.4. Alerts и runbooks

Для critical alert существует runbook, owner и recovery:

- outbox stuck;
- event poison message;
- reward partial failure;
- payment mismatch;
- booking oversubscription;
- Season activation blocked;
- content bundle failure;
- auth anomaly;
- cross-tenant attempt;
- backup failure.

-------------------------------------------------------------------------

# 34. Local development

Одна команда должна поднимать:

- databases;
- broker;
- object storage emulator;
- mail/SMS/TG fakes;
- payment sandbox/fake;
- auth;
- platform API/workers;
- school API/workers;
- web;
- support chat;
- observability minimum.

Требования:

- documented prerequisites;
- example env без секретов;
- migrations;
- seed;
- health checks;
- deterministic demo accounts;
- teardown без удаления пользовательских данных вне проекта;
- fast developer feedback.

-------------------------------------------------------------------------

# 35. CI/CD

Pipeline:

1. dependency install from lockfile;
2. format/lint;
3. typecheck;
4. unit tests;
5. schema compatibility;
6. migration validation;
7. integration tests;
8. build;
9. container scan;
10. E2E on ephemeral environment;
11. SBOM;
12. artifact signing where available;
13. deployment approval;
14. post-deploy smoke;
15. rollback check.

Environments:

- local;
- CI ephemeral;
- development;
- staging;
- production.

Production deployment требует явного approval и не входит в автономные
полномочия агента без отдельной команды пользователя.

-------------------------------------------------------------------------

# 36. Этапы реализации

## Stage 0. Intake и архитектурная фиксация

- repository audit;
- reference-intake;
- ADR stack;
- ADR deployment topology;
- dependency graph;
- threat model;
- local environment plan;
- implementation backlog;
- acceptance traceability matrix.

Exit:

- все репозитории запускаются или blocker зафиксирован;
- license/security inventory готов;
- архитектурные конфликты закрыты или вынесены;
- нет неясного authoritative owner.

## Stage 1. Foundation

- monorepo;
- CI;
- shared contracts;
- auth boundary;
- tenant/realm;
- command/event envelope;
- inbox/outbox;
- audit;
- migrations;
- observability;
- Module Manifest;
- standard Level Track.

Exit:

- synthetic Character;
- Module Association;
- one synthetic attendance reaches sandbox Reward и Progression;
- duplicate test passes.

## Stage 2. Первый вертикальный slice

    Schedule
      -> Attendance
      -> Reward
      -> Experience
      -> Level
      -> Cabinet receipt

Параллельно:

    Training Record
      -> Mastery ledger
      -> Decay/Rank
      -> Achievement
      -> Cabinet

Exit соответствует Stage 0 и MVP criteria школьного roadmap.

## Stage 3. School operational MVP

- public site;
- schedule;
- trial;
- membership;
- payment;
- CRM;
- hall calendar;
- messaging;
- Student/Guardian/Coach/Admin cabinets;
- baseline analytics;
- support chat;
- Excel import.

## Stage 4. Game MVP

- Character profile;
- full Progression MVP;
- Reward;
- Quest;
- Achievement;
- Item;
- Inventory;
- starter content;
- content bundle;
- kill switches;
- private history.

## Stage 5. Partner Content Studio MVP

- editors;
- imports;
- rule builder;
- validation;
- simulation;
- approvals;
- release center;
- asset pipeline;
- Higgsfield-generated assets;
- audit и content health.

## Stage 6. Phase 2

- Season;
- Battle Pass;
- full monthly content;
- Talent;
- manuscript collection;
- seasonal skins;
- event content;
- campaigns;
- recurring payments;
- rental self-service;
- calendar integrations;
- advanced analytics.

## Stage 7. Phase 3 и hardening

- renter cabinet;
- waitlist;
- advanced collections;
- master-rank review;
- limited event Editions;
- consented adult leaderboard only after owner exists;
- load tests;
- DR;
- production readiness review.

-------------------------------------------------------------------------

# 37. Обязательные end-to-end сценарии

## E2E-01. Guest to active student

Ad campaign → trial booking → reminder → attendance → membership purchase →
receipt → Character Association → first Reward.

## E2E-02. Attendance XP

Coach confirms attendance → one Reward → one Experience ledger entry → Level
projection → cabinet explanation.

## E2E-03. Duplicate attendance

Один Event доставлен дважды → один logical effect.

## E2E-04. Attendance correction

Correction → Reward review/reversal → append-only history → updated explanation.

## E2E-05. Mastery

Training entry → integer 75/25 allocation → daily decay → rank floor → rank
Achievement.

## E2E-06. Quest

Weekly Quest из Studio → validation → bundle → attendance progress → completion
→ Reward.

## E2E-07. Achievement tiers

Attendance thresholds → одна Definition → несколько tiers → permanent unlock.

## E2E-08. Title and Inventory

Rank unlock → Title Item → Inventory acquisition → Character selection.

## E2E-09. School Season

Edition scheduled → bindings acknowledged → activation → Quest availability →
close → grace → finalization.

## E2E-10. Battle Pass

Pass Quest → separate pass Experience → tier → free Reward → optional premium
claim without primary XP.

## E2E-11. Content rollback

Bad Reward binding → pause → prior bundle → existing earned state preserved.

## E2E-12. Guardian

Guardian sees authorized dependant schedule/payment and policy-allowed
progression, but not private unrestricted profile.

## E2E-13. Support chat

Student reports Reward issue → support case → explainability → approved
correction workflow; chat itself changes nothing.

## E2E-14. Excel migration

Repeated workbook import → dedup → ambiguity quarantine → totals reconciliation.

## E2E-15. Cross-tenant

User, API key, content reference и object path другого tenant → deny without
existence leakage.

## E2E-16. Provider failure

Payment, SMS/TG или broker temporary failure → retry/reconciliation → no
duplicate business effect.

## E2E-17. Image asset

Higgsfield generation → human review → Asset Revision → Item Definition →
published bundle → CDN delivery.

## E2E-18. Minor privacy

Попытка public share/leaderboard → blocked unless explicit permitted adult
policy; ребёнок остаётся private.

-------------------------------------------------------------------------

# 38. Required deliverables

## 38.1. Code

- source code;
- migrations;
- seed/import scripts;
- provider adapters;
- background workers;
- frontend;
- test suites;
- infrastructure definitions.

## 38.2. Contracts

- OpenAPI;
- Event schemas;
- AsyncAPI/event catalog;
- command schemas;
- content schemas;
- Module Manifest;
- Component registries;
- error catalog.

## 38.3. Documentation

- README quick start;
- architecture overview;
- ADR;
- reference intake;
- data model;
- API usage;
- local setup;
- environment matrix;
- security model;
- threat model;
- privacy map;
- runbooks;
- backup/restore;
- deployment;
- rollback;
- provider onboarding;
- support operations;
- content author guide;
- implementation status.

## 38.4. Evidence

- test reports;
- coverage;
- accessibility report;
- load test;
- security scan;
- schema compatibility;
- migration rehearsal;
- screenshots;
- demo script;
- acceptance traceability matrix.

-------------------------------------------------------------------------

# 39. Формат отчётности агента

После каждого этапа агент сообщает:

- готовый outcome;
- изменённые packages/files;
- миграции;
- новые contracts;
- выполненные tests;
- известные ограничения;
- blockers;
- security/privacy impact;
- следующий безопасный этап.

Запрещено писать «готово», если:

- функция работает только с mock и это не обозначено;
- нет authoritative persistence;
- нет permission tests;
- нет failure path;
- нет required migration;
- UI не подключён к реальному backend;
- нет acceptance evidence.

-------------------------------------------------------------------------

# 40. Решения, требующие пользователя

Агент продолжает с adapters/mocks, но не выдумывает production-решение для:

- hosting/cloud;
- production domains;
- legal entity;
- payment provider;
- fiscal receipt provider;
- SMS provider;
- Telegram bot ownership;
- email provider;
- auth/SSO provider;
- object storage/CDN;
- monitoring vendor;
- data retention approval;
- guardian policy;
- paid Battle Pass;
- Entitlement owner;
- production credentials;
- go-live time.

Если решение не блокирует код, используется интерфейс и sandbox adapter.

-------------------------------------------------------------------------

# 41. Definition of Done

Платформа считается реализованной в согласованном scope, когда:

1. нормативные инварианты представлены кодом и тестами;
2. все authoritative owners однозначны;
3. full backend сохраняет state и публикует Events атомарно;
4. duplicate/retry/replay/correction работают;
5. tenant isolation доказана;
6. User, Character и School identities разделены;
7. standard Level 1–100 воспроизводим;
8. school mastery совпадает с test vectors;
9. Reward fulfillment не пишет foreign state;
10. Quest, Achievement, Item, Inventory и Season используют immutable versions;
11. Partner Content Studio публикует целостные bundles;
12. Battle Pass не создаёт скрытый Engine;
13. public site и кабинеты используют реальные API;
14. auth и support chat интегрированы через безопасные boundaries;
15. Excel migration имеет reconciliation;
16. все финальные изображения зарегистрированы через asset pipeline;
17. Higgsfield MCP не является runtime dependency;
18. CI/CD и local environment воспроизводимы;
19. observability и runbooks готовы;
20. security/privacy gates проходят;
21. acceptance scenarios автоматизированы или имеют утверждённое evidence;
22. production deployment выполняется только после отдельного approval.

-------------------------------------------------------------------------

# 42. Первая команда coding-агенту

После получения репозиториев агент должен выполнить:

1. прочитать все документы из depends_on;
2. заполнить reference-intake;
3. запустить и проверить четыре reference repositories;
4. составить архитектурную карту;
5. создать conflict report;
6. предложить ADR stack и deployment topology;
7. создать traceability matrix;
8. подготовить Stage 0 plan;
9. начать Foundation только после фиксации решений, не требующих пользователя;
10. построить первый attendance-to-Level vertical slice до расширения каталога.

Главный принцип реализации:

> Сначала доказать один полный причинно-следственный путь, затем расширять
> платформу без нарушения владельцев данных и контрактов.
