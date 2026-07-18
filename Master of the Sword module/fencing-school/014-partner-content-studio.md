---
document: 014-partner-content-studio
title: Partner Content Studio — техническое задание
owner: Platform Team
status: Proposed
version: 0.1.0
last_updated: 2026-07-18
school_profile_status: Candidate
depends_on:
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
  - 013-context-module-integration-specification-template
---

# Partner Content Studio

## 1. Назначение

Partner Content Studio — единая тенантная админ-панель, в которой сотрудники
партнёра создают, проверяют, тестируют, согласовывают, публикуют и анализируют
игровой контент своего Context Module без изменения исходного кода платформы и
без прямого доступа к базам данных Engine.

Документ определяет:

- продуктовую область Partner Content Studio;
- архитектурную границу между Studio, Control Plane и Engine;
- полный кандидатный каталог сущностей для первого профиля
  school.fencing;
- редакторы, рабочие процессы и проверки;
- роли и права партнёра;
- требования к версиям, публикации и откату;
- требования к импорту, предпросмотру, симуляции и аналитике;
- критерии готовности и приёмки.

Версия 0.1.0 является school-first спецификацией. Каталог школы должен быть
проверен в реальной эксплуатации, после чего общие сущности выделяются в
универсальный профиль, а школьные ограничения остаются в модульном профиле.

-------------------------------------------------------------------------

# 2. Статус решений

| Решение | Статус |
|---|---|
| Studio является частью ядра платформы | DECISION |
| Партнёр работает только в своём tenant и разрешённых realm | DECISION |
| Studio не становится владельцем runtime-состояния Engine | DECISION |
| Составные сущности компилируются в Definitions владеющих Engine | DECISION |
| Первым профилем является school.fencing | DECISION |
| Основная кривая Level 1–100 не редактируется партнёром | DECISION |
| Боевой пропуск использует отдельный сезонный Progression Track | DECISION |
| Бесплатная дорожка боевого пропуска обязательна | CANDIDATE |
| Платная дорожка в школьном профиле содержит только непобеждающие награды | CANDIDATE |
| Универсальный каталог для других отраслей | OPEN после проверки школы |

-------------------------------------------------------------------------

# 3. Архитектурная позиция

## 3.1. Компоненты

    Partner employee
           |
           v
    Partner Content Studio UI
           |
           v
    Studio BFF / Authoring Orchestrator
           |
           v
    Platform Control Plane
      |    |    |    |    |    |
      v    v    v    v    v    v
    Quest Achievement Reward Item Progression Season ...
    Engine Engine      Engine Engine Engine      Engine

Studio предоставляет единый пользовательский процесс. Авторитетное состояние
остаётся в соответствующем Engine:

| Данные | Авторитетный владелец |
|---|---|
| Quest Definition, Campaign, Objective semantics | Quest Engine |
| Achievement Definition, tier и unlock | Achievement Engine |
| Reward Definition, Trigger Binding и Grant | Reward Engine |
| Item Definition и типизированная семантика | Item Engine |
| Владение Item и выбранная косметика | Inventory и Character Engine |
| Talent Definition и эффект | Talent Engine |
| Experience, Level и сезонный Progression Track | Progression Engine |
| Season Definition, Edition, Phase и Participation | Season Engine |
| Уведомление и доставка | Notification/Communications owner |
| Школьное событие, посещение, тренировка и мастерство | School Module |
| Платёж и право платной дорожки | Commerce и Entitlement owner |
| Draft workspace, шаблон, release plan и UX-проекция | Studio/Control Plane |

## 3.2. Составные сущности

Некоторые объекты Studio являются authoring-композициями, а не новым
runtime-владельцем.

Например, Battle Pass Blueprint при публикации создаёт и связывает:

- Season Edition или точную ссылку на неё;
- отдельный сезонный Progression Track;
- Reward Definitions для уровней;
- Quest и Event bindings, начисляющие pass experience;
- Item и Title Definitions;
- entitlement-политику платной дорожки;
- один неизменяемый release bundle.

Каждый Engine сохраняет собственную часть. Studio хранит карту компиляции,
точные версии, dependency graph и audit trail.

## 3.3. Запрещённые обходы

Studio НЕ ДОЛЖЕН:

- записывать данные напрямую в таблицы Engine;
- выдавать XP, Item, Achievement, Title или Talent напрямую;
- изменять опубликованную Definition на месте;
- исполнять произвольный JavaScript, SQL, Python или пользовательский код;
- позволять партнёру регистрировать новый Event Type, Reward Component Type,
  Item Type или Talent Effect Contract;
- использовать display name вместо стабильной identity;
- публиковать непроверенный cross-Engine цикл;
- смешивать платёжный ledger, игровые очки и Experience;
- считать оплату доказательством посещения или достижения;
- копировать медицинские документы, платёжные реквизиты, CRM free text или
  контакты опекунов в условия контента.

-------------------------------------------------------------------------

# 4. Цели

## 4.1. Продуктовые цели

Studio ДОЛЖЕН позволять обученному сотруднику партнёра:

1. создать типовой Quest из шаблона без участия разработчика;
2. собрать Achievement с одной или несколькими ступенями;
3. создать Title или другой Item с корректной визуальной семантикой;
4. собрать Reward из разрешённых компонентов;
5. создать Season и связанную Edition;
6. собрать бесплатный или бесплатный плюс premium Battle Pass;
7. связать контент с проверенными событиями модуля;
8. увидеть зависимости и последствия до публикации;
9. протестировать контент на синтетическом Character;
10. согласовать и запланировать release bundle;
11. безопасно остановить активацию или вернуться к предыдущему bundle;
12. увидеть фактическое использование, прогресс и ошибки после запуска.

## 4.2. Архитектурные цели

- один общий authoring UX поверх независимых Engine;
- строгая tenant и realm изоляция;
- неизменяемость опубликованных версий;
- воспроизводимая компиляция составного контента;
- explainable validation и simulation;
- идемпотентная публикация;
- полный аудит;
- расширение каталога без превращения Studio в универсальный workflow runtime.

-------------------------------------------------------------------------

# 5. Не-цели первой версии

В первую версию НЕ входят:

- создание новых программных механик партнёром;
- редактор исходного кода;
- произвольные формулы без ограниченной AST-схемы;
- конструктор CRM, биллинга, расписания или учебного журнала;
- создание платёжных продуктов и цен;
- управление физической доставкой наград;
- магазин, аукцион, обмен предметами между учениками;
- игровая валюта, пока Currency Engine отключён;
- случайные loot boxes;
- публичные рейтинги несовершеннолетних;
- генерация контента ИИ с автоматической публикацией;
- изменение стандартной основной кривой Level 1–100;
- ручное редактирование фактического прогресса ученика.

-------------------------------------------------------------------------

# 6. Термины Studio

| Термин | Определение |
|---|---|
| Content Entity | создаваемая партнёром сущность или композиция |
| Draft | редактируемое, неисполняемое содержимое |
| Definition | стабильная идентичность контента во владеющем Engine |
| Definition Version | неизменяемая опубликованная семантика |
| Workspace | набор связанных Draft одного автора или команды |
| Template | безопасная заготовка без runtime-состояния |
| Blueprint | составной Draft, компилируемый в несколько Engine |
| Release Bundle | content-addressed набор точных опубликованных версий |
| Activation Plan | расписание активации и правила отката bundle |
| Validation Report | воспроизводимый отчёт всех проверок |
| Simulation Run | тестовый расчёт без production-эффектов |
| Module Content Profile | разрешённые типы, события, лимиты и шаблоны модуля |
| Tenant Namespace | пространство ключей конкретного партнёра |

-------------------------------------------------------------------------

# 7. Роли и права

## 7.1. Роли

| Роль | Основные действия |
|---|---|
| Partner Owner | настройки tenant, назначения ролей, финальное высокорисковое согласование, аудит |
| Content Manager | каталог, шаблоны, workspace, release bundle и календарь |
| Content Author | создание и изменение Draft, preview и обычная simulation |
| Content Reviewer | комментарии, safety и narrative review, запрос изменений |
| Content Approver | утверждение прошедшей проверки версии |
| Content Publisher | публикация и планирование разрешённых bundle |
| Asset Manager | медиа, лицензии, alt text, локализация |
| Analyst | read-only аналитика, simulation reports и export |
| Coach Reviewer | проверка учебной корректности и физической безопасности |
| Safeguarding Reviewer | проверка несовершеннолетних, приватности и социального давления |
| Support Operator | просмотр explainability и запуск разрешённых recovery workflows |
| Platform Operator | registry, контрактные лимиты, аварийная остановка и cross-tenant support по отдельному доступу |

## 7.2. Базовые разрешения

Разрешения выдаются по tenant, realm, moduleKey, namespace и типу сущности.

Минимальный набор scopes:

- content.catalog.read;
- content.draft.create;
- content.draft.edit;
- content.draft.delete;
- content.template.use;
- content.template.manage;
- content.asset.manage;
- content.localization.manage;
- content.validate;
- content.simulate;
- content.review;
- content.approve;
- content.publish;
- content.schedule;
- content.pause;
- content.rollback;
- content.archive;
- content.audit.read;
- content.analytics.read;
- content.import;
- content.export.

Engine-specific scopes применяются дополнительно, например:

- quest.definition.author;
- achievement.definition.author;
- reward.definition.author;
- item.definition.author;
- talent.definition.author;
- progression.track.author_seasonal;
- season.definition.author.

## 7.3. Разделение обязанностей

- Автор НЕ ДОЛЖЕН единолично публиковать High Risk изменение.
- Reviewer и Approver могут быть одним лицом только для Low Risk профиля.
- Платная дорожка, массовая награда, primary XP, access token и контент для
  несовершеннолетних требуют минимум двух независимых подтверждений.
- Платформенный оператор не получает постоянный доступ к tenant по умолчанию.
- Временный support-доступ имеет срок, причину и аудит.

-------------------------------------------------------------------------

# 8. Полный каталог создаваемых сущностей для school.fencing

Ниже приведён кандидатный полный перечень. Статус Allowed означает, что партнёр
может создать сущность из разрешённой схемы. Composite означает, что Studio
компилирует объект в несколько Engine. Reference означает, что объект выбирается
из School Module, но не создаётся в Studio.

## 8.1. Контракт Module Content Profile

Каждый подключённый модуль ДОЛЖЕН опубликовать машинно-проверяемый профиль.
Интерфейс, API, импорт и compiler используют одну и ту же exact profile version.

| Поле профиля | Назначение |
|---|---|
| profileKey и version | стабильная идентичность профиля |
| moduleKey | Context Module |
| tenantMode | single или multi tenant |
| allowedEntityTypes | создаваемые типы и feature phase |
| allowedEventTypes | события, доступные Rule Builder |
| allowedPredicates | поля, операторы, агрегаты и классификация |
| allowedRewardComponents | компоненты, owners и caps |
| allowedItemTypes | типы, subtypes и policies |
| allowedTalentEffects | зарегистрированные effect contracts |
| allowedBusinessReferences | каталоги School Module для выбора |
| templates | platform и module templates |
| limits | размеры, пороги, частота и bulk limits |
| riskPolicies | классификация и требуемые approvals |
| safetyPolicies | физическая безопасность и safeguarding |
| privacyPolicies | minors, visibility и export |
| featureFlags | premium pass, Talent authoring и другие фазы |
| requiredLocales | обязательная локализация |
| assetPolicies | форматы, размеры, лицензии и moderation |
| simulationSuites | обязательные fixtures и cohorts |
| activationPolicies | rollout, schedule, pause и rollback |

Минимальная логическая форма профиля:

    profileKey: school.fencing.content-profile
    profileVersion: 1
    moduleKey: school.fencing
    allowedEntityTypes:
      - QUEST
      - ACHIEVEMENT
      - REWARD
      - ITEM
      - TITLE
      - SEASON
      - BATTLE_PASS
    allowedEventTypes:
      - school.training.attendance.recorded.v1
      - school.weapon.mastery.rank.changed.v1
    allowedRewardComponents:
      - EXPERIENCE
      - ITEM
    experienceTrackRoles:
      - PRIMARY
      - SEASON_PASS
    featureFlags:
      premiumBattlePass: false
      talentAuthoring: false

Профиль проходит versioning и publication как platform configuration. Изменение
профиля не меняет опубликованный контент автоматически. Studio выполняет impact
analysis и требует явную миграцию или новый release bundle.

## 8.2. Управление и организация контента

| Сущность | Режим | Назначение |
|---|---|---|
| Workspace | Allowed | группа связанных Draft и участников |
| Content Template | Allowed with limits | переиспользуемая заготовка |
| Folder | Allowed | навигационная организация каталога |
| Tag | Allowed | поиск и классификация без runtime-семантики |
| Content Collection | Allowed | логическая подборка Definitions |
| Audience Preset | Allowed with limits | безопасный переиспользуемый targeting |
| Media Asset | Allowed | изображение, анимация, звук, документ-превью |
| Localization Entry | Allowed | название, описание, подсказка и alt text |
| Localization Pack | Allowed | согласованный набор языковых значений |
| Release Bundle | Composite | точные версии всех зависимостей |
| Activation Plan | Allowed | активация, расписание, canary и rollback |

## 8.3. Сезоны

| Сущность | Режим | Назначение |
|---|---|---|
| Season Definition | Allowed | стабильная повторяемая концепция сезона |
| Season Definition Version | Generated on publish | неизменяемая семантика |
| Season Edition | Allowed | конкретный запуск с датами |
| Season Phase | Allowed | этап сезона |
| Phase Lane | Allowed with limits | параллельные календарные линии |
| Enrollment Window | Allowed | окно вступления |
| Participation Policy | Allowed from presets | auto, opt-in, invitation, qualification |
| Eligibility Policy | Allowed from predicates | допустимая аудитория |
| Season Content Binding | Composite | привязка Quest, Achievement, Pass и другого контента |
| Grace/Lateness Policy | Allowed from presets | поздние события и завершение |
| Season Presentation | Allowed | тема, обложка, название и описание |

Школьные примеры: учебный год, осенний набор, зимняя дисциплина, весенний
турнир, летняя практика, отдельный фестиваль или тематический интенсив.

## 8.4. Боевые пропуски и сезонные пути

Термин Battle Pass является продуктовым. Для школы пользовательское название
может быть «Сезонный путь», «Путь ученика» или другое локализованное название.

| Сущность | Режим | Назначение |
|---|---|---|
| Battle Pass Blueprint | Composite | корневая authoring-композиция |
| Battle Pass Edition | Composite | конкретный запуск внутри Season Edition |
| Pass Progression Track | Generated | отдельная шкала pass experience |
| Pass Tier | Allowed | порог и награды одного уровня |
| Free Reward Lane | Required | бесплатная дорожка |
| Premium Reward Lane | Optional, High Risk | дорожка по entitlement |
| Pass Milestone | Allowed | крупная награда или презентация на выбранном tier |
| Pass XP Source Binding | Allowed from registry | источники сезонного опыта |
| Pass Quest Binding | Allowed | задания, дающие pass experience |
| Pass Access Policy | Allowed from presets | free, entitlement, invitation |
| Pass Claim Policy | Allowed from presets | auto или manual claim |
| Pass Catch-up Policy | Allowed from presets | поздний вход и догоняющая механика |
| Pass Completion Reward | Optional | награда за полный путь |
| Pass Presentation Theme | Allowed | обложка, карта, lane и tier presentation |

Обязательные правила:

1. Pass experience отделён от primary Experience.
2. Progress принадлежит Progression Engine, а не Season Engine и не Studio.
3. Season Engine владеет временем и Participation.
4. Reward Engine владеет выдачей наград.
5. Бесплатная дорожка обязательна.
6. Premium entitlement не должен начислять pass experience.
7. Ретроактивная выдача premium-наград после покупки задаётся явно.
8. Tier thresholds являются строго возрастающими целыми числами.
9. Публикация блокируется при пропущенном tier или неразрешимой награде.
10. В school.fencing premium-награды не дают primary XP, mastery points,
    функциональный Talent или преимущество в тренировках и турнирах.
11. Продажа несовершеннолетнему подчиняется Commerce и guardian policy.
12. Завершение pass не удаляет уже полученные Items и Achievements.

## 8.5. Кампании и сюжетные структуры

| Сущность | Режим | Назначение |
|---|---|---|
| Campaign Definition | Allowed | связанная последовательность Quest |
| Campaign Edition | Generated or Allowed | конкретный сезонный запуск |
| Campaign Chapter | Allowed | сюжетная глава или этап |
| Quest Chain | Allowed | линейная или ограниченно ветвящаяся последовательность |
| Chapter Gate | Allowed from predicates | вход по фактам, Quest или Achievement |
| Campaign Completion Rule | Allowed | критерий завершения |
| Campaign Completion Reward | Optional | итоговая Reward Definition |
| Campaign Presentation | Allowed | карта, главы, иллюстрации и narrative text |

Школьные примеры: «Путь ученика», «Восемь путей», вводный курс безопасности,
история оружейной школы, турнирная неделя.

## 8.6. Задания

| Сущность | Режим | Назначение |
|---|---|---|
| Quest Definition | Allowed | стабильная идентичность задания |
| Quest Edition | Generated or Allowed | версия для аудитории или сезона |
| Quest Objective | Allowed | одна измеримая цель |
| Objective Group | Allowed | ALL, ANY или последовательность |
| Optional Objective | Allowed | дополнительная цель |
| Quest Prerequisite | Allowed | предыдущий Quest, Achievement, Level или факт |
| Quest Eligibility Policy | Allowed from predicates | кому доступно |
| Quest Recurrence | Allowed from presets | once, daily, weekly, monthly, seasonal |
| Quest Availability Window | Allowed | даты и локальный календарь |
| Quest Completion Rule | Allowed | завершение по целям |
| Quest Reward Binding | Allowed | точная Reward Definition |
| Quest Failure/Expiry Policy | Allowed from presets | поведение при окончании |
| Quest Correction Policy | Required when reversible source | исправление исходного факта |
| Quest Presentation | Allowed | название, текст, иконка и progress wording |

Типы Quest школьного профиля:

- onboarding;
- training-day;
- weekly consistency;
- monthly discipline;
- seasonal;
- safety and rules;
- curriculum;
- weapon practice;
- event or tournament participation;
- community;
- mentoring;
- referral;
- collection;
- comeback;
- guardian-aware youth journey.

## 8.7. Условия и счётчики

Партнёр может собирать условия только из зарегистрированных predicates:

- событие произошло;
- число уникальных событий достигло порога;
- сумма разрешённого целочисленного поля достигла порога;
- серия последовательных календарных периодов;
- наличие Achievement, Item, Talent или Title;
- достижение Level или mastery rank;
- завершение Quest или Campaign;
- участие в Season;
- принадлежность разрешённому audience;
- временное окно;
- ALL, ANY и ограниченный NOT для безопасных фактов.

Studio предоставляет:

- Counter Definition;
- Time Window;
- Distinctness Key;
- Threshold;
- Grouping Key;
- Reset Policy;
- Correction Policy;
- Lateness Policy.

Произвольный доступ к Event payload запрещён. UI показывает только allowlisted
поля с типами, описанием, классификацией и допустимыми операторами.

## 8.8. Достижения

| Сущность | Режим | Назначение |
|---|---|---|
| Achievement Definition | Allowed | стабильная идентичность достижения |
| Achievement Tier | Allowed | ступень одной Definition |
| Achievement Condition | Allowed from predicates | условие unlock |
| Achievement Prerequisite | Allowed | зависимость от другого контента |
| Hidden Achievement Policy | Allowed | секретность до открытия |
| Recognition Presentation | Allowed | badge, card, animation, share-safe text |
| Achievement Reward Binding | Optional | дополнительная Reward |
| Integrity/Correction Policy | Required | исправление ошибочных исходных фактов |

Школьные категории:

- первый шаг;
- посещаемость;
- стабильность;
- возвращение;
- безопасность;
- обучение;
- мастерство по каждому оружию;
- владение несколькими оружиями;
- все восемь путей;
- участие в событиях;
- турнир;
- мастер-класс;
- наставничество;
- годовщина;
- коллекция.

## 8.9. Титулы

Title Editor является специализированным интерфейсом Item Editor. В runtime
титул публикуется как COSMETIC Item Definition с subtype TITLE.

| Сущность | Режим | Назначение |
|---|---|---|
| Title Definition | Allowed | отображаемый титул |
| Title Presentation Variant | Allowed | грамматическая или визуальная версия |
| Title Unlock Binding | Allowed | Reward, Quest, Achievement, Level или rank |
| Title Visibility Policy | Allowed | private, tenant, share-safe |
| Title Collection | Allowed | тематический набор |

Партнёр не создаёт новый entitlement owner. Inventory владеет полученным
титулом, Character Engine хранит только выбранную presentation identity.

## 8.10. Награды

| Сущность | Режим | Назначение |
|---|---|---|
| Reward Definition | Allowed | состав и политика награды |
| Reward Component | Allowed from registry | один типизированный результат |
| Reward Trigger Binding | Allowed from registry | связь факта и Reward |
| Reward Bundle | Allowed | переиспользуемый набор компонентов |
| Manual-use Reward | High Risk | поддержка по зарегистрированному workflow |
| Claim Policy | Allowed from presets | auto, manual, delayed |
| Expiry Policy | Allowed from presets | срок claim или fulfillment |
| Repeatability Policy | Required | once, source, period, character |
| Duplicate Policy | Required | no-op, alternate, stack или reject |
| Reversal Policy | Required | поведение при коррекции |
| Compensation Policy | High Risk | частичный сбой или невозможный reversal |

Разрешённые компоненты school.fencing:

- primary Experience в пределах policy caps;
- pass experience отдельного сезонного Track;
- Item;
- Title как Item;
- cosmetic Item;
- trophy или collectible;
- access token с зарегистрированным consumer;
- Talent point или Talent unlock только при зарегистрированном контракте;
- informational recognition без authoritative effect, если тип разрешён.

До появления владельца запрещены:

- игровая валюта;
- reputation;
- физический предмет как автоматически выполненная доставка;
- скидка или денежный баланс внутри Reward Engine;
- произвольный entitlement;
- отрицательный Experience.

## 8.11. Предметы

Партнёр создаёт Item Definitions разрешённых типов, но не новые Item Types.

| Item Type | Разрешённые школьные подтипы |
|---|---|
| COSMETIC | avatar, frame, banner, profile theme, weapon aura, title, cosmetic effect |
| TROPHY | rank seal, tournament crest, anniversary mark, event badge |
| COLLECTIBLE | manuscript fragment, weapon emblem, event token, monthly die |
| ACCESS_TOKEN | guest pass, master-class invitation, approved voucher |
| CONSUMABLE | cosmetic dye, one-use presentation effect |
| QUEST_ITEM | chapter evidence, temporary token, campaign object |

Создаваемые сущности:

| Сущность | Режим | Назначение |
|---|---|---|
| Item Definition | Allowed | один цифровой предмет |
| Item Presentation Revision | Allowed | визуал без изменения владения |
| Item Collection | Allowed | тематическая коллекция |
| Item Set | Allowed | набор с completion condition |
| Cosmetic Skin Set | Allowed | группа согласованных визуальных вариантов |
| Collection Completion Rule | Allowed | критерий заполнения |
| Collection Completion Reward | Optional | Reward за завершение |
| Rarity Presentation | Allowed from tenant palette | визуальная редкость без скрытой экономики |
| Acquisition Hint | Allowed | безопасная подсказка получения |
| Equip Slot Binding | Allowed from registry | допустимый presentation slot |
| Consumption Policy | Allowed from registered contract | поведение consumable/access token |

Обязательные поля Item:

- стабильный itemKey;
- зарегистрированный Item Type и subtype;
- локализованное имя и описание;
- ownership model;
- unique или stack policy;
- transfer policy;
- expiry;
- duplicate behavior;
- presentation assets;
- accessibility fallback;
- acquisition visibility;
- consumer contract для ACCESS_TOKEN, CONSUMABLE и QUEST_ITEM;
- физическая оговорка, если изображение напоминает реальную награду.

## 8.12. Таланты

| Сущность | Режим | Назначение |
|---|---|---|
| Talent Tree Definition | Allowed in Phase 2 | дерево развития |
| Talent Node Definition | Allowed from effect registry | узел |
| Talent Rank | Allowed | ступень узла |
| Talent Prerequisite | Allowed | Level, Achievement, Node или Item |
| Talent Cost Policy | Allowed from registry | разрешённый ресурс |
| Talent Effect Binding | Allowed from registry | точный контракт эффекта |
| Talent Loadout Preset | Optional | рекомендуемая конфигурация |
| Talent Presentation | Allowed | иконка, описание и explainability |

Для школы Talent не должен:

- повышать физическую нагрузку;
- создавать преимущество, доступное только за оплату;
- обходить Reward caps;
- автоматически подтверждать навык или безопасность;
- заменять решение тренера.

## 8.13. Основной Level и milestone-контент

Партнёр НЕ создаёт и не меняет стандартную кривую Level 1–100.

Он может создавать:

| Сущность | Режим | Назначение |
|---|---|---|
| Level Milestone Binding | Allowed | Reward или presentation на выбранном Level |
| Level Celebration | Allowed | визуальная реакция |
| Level Range Theme | Allowed | косметическая тема диапазона |
| Level-gated Quest | Allowed | eligibility Quest |
| Level-gated Item Hint | Allowed | отображение будущей награды |

Любое начисление primary Experience создаётся через Reward Definition и
Trigger Binding с лимитами платформы.

## 8.14. Школьное мастерство

Weapon mastery является бизнес-состоянием School Module. Studio не редактирует
ledger и формулу, но может создавать контент, реагирующий на опубликованные
safe outcome events.

| Сущность | Режим | Назначение |
|---|---|---|
| Mastery Rank Recognition Binding | Allowed | rank change → Achievement/Reward |
| Weapon Track Presentation | Allowed | название, иконка, narrative |
| Rank Seal Family | Composite | генерация Item на ранги 1–10 |
| Weapon Achievement Family | Composite | генерация tiered Achievement |
| Cross-weapon Achievement | Allowed | несколько rank conditions |
| Monthly Bonus Quest Binding | Allowed with review | Quest по безопасному outcome |

Партнёр не меняет в Studio:

- формулу 75/25;
- daily decay;
- earned-rank floor;
- массу оборудования;
- исходные тренировочные записи;
- подтверждение упражнения тренером.

Это настраивается или исправляется в School Operations, а не в Content Studio.

## 8.15. Уведомления и презентационные реакции

| Сущность | Режим | Назначение |
|---|---|---|
| Notification Template | Allowed | текст по подтверждённому событию |
| In-product Receipt Template | Allowed | короткое объяснение результата |
| Celebration Template | Allowed | Level, Achievement, Rank, Campaign |
| Reminder Content | Allowed with Communications policy | напоминание о доступном контенте |
| Share Card Template | Allowed with privacy review | добровольная безопасная карточка |
| Reduced-motion Variant | Required for animation | доступная альтернатива |

Шаблон не определяет доставку и не может сам создать Reward.

## 8.16. Аудитории и доступность

Партнёр может создавать только bounded Audience Presets:

- все активные Character Association tenant;
- возрастная группа из безопасной категории, без точной даты рождения;
- направление обучения;
- подтверждённая группа или программа;
- новый или действующий ученик;
- участник конкретной Season;
- достигнутый Level или mastery rank;
- наличие prerequisite;
- приглашённый список с законным основанием.

Запрещены аудитории по:

- диагнозу или медицинскому документу;
- платёжному инструменту;
- свободному CRM-комментарию;
- контактам опекуна;
- зарплате тренера;
- скрытой оценке «плохой» или «слабый» ученик;
- чувствительному поведенческому профилированию.

-------------------------------------------------------------------------

# 9. Объекты School Module, которые Studio только использует как ссылки

Следующие сущности партнёр может создавать или изменять в операционной админке
школы, но НЕ в Partner Content Studio:

| Business Entity | Владелец |
|---|---|
| Направление и учебная программа | School Training/Curriculum |
| Каноническое оружие | School Mastery taxonomy |
| Упражнение и safety limits | School Training |
| Equipment Specification | School Training |
| Тренер | School Identity/HR |
| Зал и площадка | School Scheduling |
| Группа | School Scheduling |
| Session | School Scheduling |
| Посещение | School Training |
| Training Record | School Training |
| Tournament/Event | School Booking/Event |
| Membership, offer и invoice | School Commerce |
| Lead и CRM segment | School CRM |
| Guardian consent | School Identity/Privacy |

Studio получает stable ID, display projection и разрешённые predicates через
зарегистрированные read contracts. Удаление или retirement business entity
запускает impact analysis для зависимого контента.

-------------------------------------------------------------------------

# 10. Разрешённые события school.fencing

Content Author видит только события, зарегистрированные в Module Manifest.

## 10.1. Разрешённые для обычного контента

- school.student.enrolled.v1;
- school.trial.attendance.recorded.v1;
- school.membership.activated.v1;
- school.membership.renewed.v1;
- school.training.attendance.recorded.v1;
- school.weapon.monthly.bonus.rolled.v1;
- school.weapon.mastery.rank.changed.v1;
- school.referral.qualified.v1;
- school.event.participation.recorded.v1;
- progression.level.changed.v1;
- quest.completed.v1;
- achievement.unlocked.v1;
- inventory.item.acquired.v1;
- season lifecycle и participation events.

## 10.2. Ограниченные или только для correction

- school.training.attendance.corrected.v1;
- school.training.record.voided.v1;
- reward.revoked.v1;
- school.payment.refunded.v1;
- Character closure и association change.

## 10.3. Не являются default reward triggers

- school.payment.completed.v1;
- school.booking.confirmed.v1;
- school.trial.booking.created.v1.

Коммерческое событие может использоваться только отдельной reviewed policy и
не должно масштабировать Experience суммой покупки.

## 10.4. Обнаруженный контрактный пробел

Текущий школьный контент содержит Achievement по прохождению safety briefing,
но Module Manifest не объявляет отдельное подтверждённое safety event.

До регистрации владельца и Event Contract:

- условие нельзя опубликовать;
- Studio показывает blocker;
- нельзя заменять событие ручным флагом без аудита.

-------------------------------------------------------------------------

# 11. Информационная архитектура интерфейса

Studio ДОЛЖЕН содержать:

1. Dashboard.
2. Catalog.
3. Create Wizard.
4. Universal Definition Editor.
5. Specialized Editors.
6. Templates.
7. Assets and Localization.
8. Dependency Graph.
9. Preview.
10. Simulation Lab.
11. Review Queue.
12. Release Center.
13. LiveOps Calendar.
14. Analytics.
15. Audit Log.
16. Module Profile and Limits.

## 11.1. Dashboard

Показывает:

- Draft, требующие продолжения;
- review queue;
- scheduled activations;
- active Seasons и Battle Pass;
- validation blockers;
- content health alerts;
- последние публикации и rollback;
- использование квот;
- срочные approval или safety задачи.

## 11.2. Catalog

Catalog поддерживает:

- фильтр по типу, статусу, автору, сезону, аудитории и тегу;
- поиск по key, названию и dependency;
- сохранённые представления;
- bulk selection;
- просмотр active version;
- раскрытие Draft рядом с published version;
- duplicate, archive и export;
- индикаторы orphan, blocker, deprecated dependency и hidden content.

## 11.3. Create Wizard

Шаги:

1. выбрать тип сущности;
2. выбрать blank, approved template или clone;
3. указать identity и presentation;
4. собрать condition или структуру;
5. выбрать Reward и зависимости;
6. определить audience и availability;
7. добавить assets и localization;
8. запустить validation;
9. выполнить preview и simulation;
10. отправить на review.

## 11.4. Universal Editor

Все редакторы имеют общие области:

- Overview;
- Logic;
- Rewards;
- Audience;
- Schedule;
- Presentation;
- Localization;
- Dependencies;
- Safety;
- Telemetry;
- Versions;
- Comments;
- Validation.

Редактор поддерживает autosave, optimistic concurrency, presence, комментарии,
историю Draft и восстановление последней сохранённой ревизии.

-------------------------------------------------------------------------

# 12. Общие поля Content Entity

| Поле | Требование |
|---|---|
| entityKey | уникальный стабильный ключ в namespace |
| entityType | зарегистрированный тип |
| tenantId | только из authenticated context |
| realmKey | разрешённый realm |
| moduleKey | активный Module Content Profile |
| displayName | localization key |
| shortDescription | localization key |
| longDescription | optional localization key |
| owner | ответственная роль или principal |
| tags | каталогизация |
| audience | точный policy reference |
| availability | окно или Season binding |
| visibility | public, private, hidden, embargoed |
| assets | immutable asset revisions |
| dependencies | exact или compatible draft references |
| correctionPolicy | обязательно для reversible facts |
| telemetryKey | стабильная аналитическая identity |
| riskLevel | Low, Medium, High, Prohibited |
| status | lifecycle state |
| version | после publication |
| contentHash | после publication |
| createdBy/At | аудит |
| reviewedBy/At | аудит |
| publishedBy/At | аудит |

Ключ автоматически предлагается из namespace и slug, но после первой
публикации не меняется. Display name может меняться только новой версией или
разрешённой presentation revision согласно контракту Engine.

-------------------------------------------------------------------------

# 13. No-code Rule Builder

## 13.1. Возможности

Rule Builder поддерживает:

- выбор Event или projection fact из Registry;
- типизированные поля;
- сравнение строкового enum, boolean, integer, stable ID и trusted time;
- count, distinct count и bounded integer sum;
- ALL, ANY и ограниченный NOT;
- календарные периоды tenant time zone;
- prerequisite references;
- preview объяснения человеческим языком;
- генерацию тестовых fixtures;
- отображение correction и lateness semantics.

## 13.2. Ограничения

- максимальная глубина выражения задаётся platform limit;
- максимальное число узлов задаётся platform limit;
- regex доступен только для заранее разрешённых presentation-полей;
- float не используется в authoritative расчётах;
- свободный текст не используется как condition;
- поля RESTRICTED скрыты, если для задачи нет отдельного контракта;
- неизвестный enum блокирует publication;
- NOT над отсутствующим или privacy-deleted фактом запрещён без явной
  three-state semantics;
- условие, вознаграждающее небезопасный физический объём, блокируется.

## 13.3. Explainability

Для каждого правила UI показывает:

- что считается;
- откуда приходит факт;
- какой период используется;
- какие дубликаты исключаются;
- что происходит при исправлении;
- почему тестовый Character подходит или не подходит;
- какой exact Definition Version будет применён.

-------------------------------------------------------------------------

# 14. Шаблоны

## 14.1. Платформенные шаблоны

- onboarding campaign;
- one-time Quest;
- weekly Quest;
- monthly Quest;
- tiered Achievement;
- collection Achievement;
- Level milestone Reward;
- Item and cosmetic;
- Season with phases;
- free Battle Pass;
- free plus premium cosmetic Battle Pass.

## 14.2. Школьные шаблоны

- первое посещение;
- серия посещений;
- тренировка на неделе;
- месячная дисциплина;
- новый mastery rank;
- десять рангов одного оружия;
- восемь оружейных направлений;
- участие в мероприятии;
- наставничество;
- мастер-класс;
- турнир;
- safety briefing, заблокирован до появления Event Contract;
- учебный год из четырёх фаз;
- «Восемь путей»;
- набор rank seals;
- сезонная manuscript collection.

Шаблон хранит только Draft defaults. Его изменение не меняет сущности, ранее
созданные из шаблона.

-------------------------------------------------------------------------

# 15. Импорт и экспорт

## 15.1. Импорт

Поддерживаются:

- XLSX;
- CSV;
- JSON;
- YAML для expert workflow.

Импорт всегда проходит:

1. upload;
2. malware и format checks;
3. staging;
4. schema mapping;
5. dry run;
6. row-level validation;
7. dependency resolution;
8. duplicate detection;
9. preview diff;
10. создание Draft.

Импорт НЕ публикует контент автоматически.

## 15.2. Массовые операции

Должны поддерживаться:

- создание Item family;
- создание Achievement tiers;
- создание Pass tiers;
- изменение tags и owner;
- замена asset reference;
- назначение Season;
- retirement plan;
- export validation errors.

Каждая массовая операция имеет job identity, progress, partial failure report,
cancel до commit и audit.

## 15.3. Экспорт

Экспорт включает:

- человекочитаемый XLSX/CSV для контент-команды;
- canonical JSON/YAML;
- dependency manifest;
- localization gaps;
- validation report;
- version diff;
- release bundle manifest.

Секретный или embargoed контент экспортируется только с отдельным scope.

-------------------------------------------------------------------------

# 16. Assets и локализация

## 16.1. Asset Library

Для asset хранятся:

- stable asset identity;
- immutable revision;
- MIME type;
- dimensions и size;
- checksum;
- license/source;
- owner;
- alt text;
- focal point;
- light/dark variants;
- reduced-motion fallback;
- safe-area preview;
- moderation status;
- usage graph.

Удалить опубликованный используемый asset физически нельзя. Можно прекратить
новое использование и выпустить заменяющую revision.

## 16.2. Localization

Studio показывает:

- обязательные locales tenant;
- missing и stale translations;
- переменные шаблона;
- plural forms;
- длину и overflow preview;
- fallback chain;
- терминологический словарь модуля.

Машинный перевод может создать только untrusted Draft и требует human review.

-------------------------------------------------------------------------

# 17. Preview и Simulation Lab

## 17.1. Preview

Preview не создаёт authoritative state и показывает:

- карточку Quest;
- прогресс Objective;
- Achievement locked/unlocked/hidden;
- Item и Title;
- Reward receipt;
- Season page;
- Battle Pass tiers и lanes;
- mobile, desktop и reduced-motion view;
- student, guardian и staff visibility.

## 17.2. Simulation

Simulation принимает:

- synthetic Character;
- tenant и realm;
- Level;
- возрастную privacy-категорию;
- membership и direction facts;
- набор событий;
- временную шкалу;
- attendance cohort;
- выбранные Definition Draft;
- correction, duplicate и late-event сценарии.

Результат показывает:

- Quest progress;
- Achievement progress;
- Reward decisions;
- primary и pass Experience;
- Level transitions;
- Items;
- Battle Pass tiers;
- cross-Engine causal chain;
- caps и suppressed grants;
- unresolved dependencies;
- предупреждения fairness и pacing.

## 17.3. Обязательные школьные когорты

- редкое посещение;
- типичное посещение;
- частое безопасное посещение;
- новый ученик в середине Season;
- несовершеннолетний с guardian policy;
- исправленное посещение;
- повторно доставленное событие;
- позднее событие;
- ученик с Rank 0;
- ученик с несколькими оружейными направлениями.

Simulation result имеет fingerprint и не может быть использован как production
grant.

-------------------------------------------------------------------------

# 18. Validation Pipeline

Публикация проходит все уровни:

## V1. Structural

- обязательные поля;
- типы;
- размеры;
- уникальность key;
- корректная сериализация.

## V2. Semantic

- допустимые значения;
- возрастающие thresholds;
- корректные recurrence и windows;
- доступный Item subtype;
- Reward Component имеет owner.

## V3. Reference

- все зависимости существуют;
- exact version доступна;
- business reference active или имеет policy retirement;
- localization и assets готовы.

## V4. Global graph

- нет запрещённых Reward → Quest → Reward циклов;
- нет циклических prerequisites;
- нет recursive XP milestone;
- порядок компиляции однозначен.

## V5. Security, privacy and safety

- tenant isolation;
- нет RESTRICTED payload без контракта;
- minors visibility;
- нет небезопасного физического стимула;
- нет коммерческой дискриминации;
- hidden content не раскрывается.

## V6. Economy and pacing

- XP caps;
- pass thresholds;
- достижимость;
- отсутствие бесконечного repeat;
- duplicate и reversal;
- premium lane restrictions.

## V7. Simulation

- обязательные fixtures;
- low, typical и high cohorts;
- duplicate, correction, late и rollback cases.

## V8. Release readiness

- approvals;
- owner;
- activation window;
- rollback target;
- observability;
- kill switch;
- bundle fingerprint.

Validation result содержит code, severity, entity, field path, объяснение,
предложение исправления и ссылку на нормативное правило.

-------------------------------------------------------------------------

# 19. Риск-классификация и согласование

| Риск | Примеры | Минимальное согласование |
|---|---|---|
| Low | текст, tag, обычный cosmetic preview | Author + automated validation |
| Medium | Quest, Achievement, Item, bounded Reward | Author + Reviewer/Approver |
| High | primary XP, mass Reward, premium pass, access token, minors targeting, retroactive activation | Author + domain reviewer + independent Approver + Publisher |
| Prohibited | arbitrary code, negative XP, pay-to-win school effect, sensitive targeting, direct database write | публикация невозможна |

Coach Reviewer обязателен для:

- физической нагрузки;
- упражнений;
- mastery semantics;
- safety контента;
- турнирного признания.

Safeguarding Reviewer обязателен для:

- несовершеннолетних;
- публичного sharing;
- streak, shame или social pressure mechanics;
- платного сезонного пути;
- guardian visibility.

-------------------------------------------------------------------------

# 20. Жизненный цикл

Основной lifecycle:

    DRAFT
      -> VALIDATING
      -> READY_FOR_REVIEW
      -> IN_REVIEW
      -> CHANGES_REQUESTED -> DRAFT
      -> APPROVED
      -> PUBLISHED
      -> SCHEDULED
      -> ACTIVE
      -> PAUSED
      -> RETIRED
      -> ARCHIVED

Правила:

1. Draft редактируем.
2. Любое изменение после validation инвалидирует report.
3. Published version неизменяема.
4. Изменение semantic field создаёт новую version.
5. Scheduled activation использует trusted time.
6. Pause не переписывает полученные результаты.
7. Rollback активирует предыдущий совместимый bundle для новых решений.
8. Existing Grants, Item ownership и unlock history не удаляются rollback.
9. Retirement прекращает новое назначение, но сохраняет историческое разрешение.
10. Physical deletion допустим только для никогда не опубликованного Draft при
    отсутствии legal hold и зависимостей.

-------------------------------------------------------------------------

# 21. Release Center и LiveOps

## 21.1. Release Bundle

Bundle содержит:

- exact Definition Version IDs;
- exact Engine owner;
- schema versions;
- content hashes;
- asset revisions;
- localization pack revisions;
- dependency graph;
- activation order;
- required acknowledgements;
- risk summary;
- rollback target;
- kill switches.

## 21.2. Publication

1. freeze approved Draft revisions;
2. compile Blueprints;
3. publish Engine-owned Definitions идемпотентно;
4. validate returned identities and fingerprints;
5. assemble immutable bundle;
6. receive owner readiness acknowledgements;
7. schedule or activate;
8. publish audit event;
9. monitor health.

Partial publication не может стать Active. Recovery продолжает с сохранённого
checkpoint или создаёт новый release attempt.

## 21.3. Rollout

Поддерживаются:

- sandbox;
- internal staff;
- allowlisted test Characters;
- percentage canary, если тип контента допускает;
- tenant-wide activation;
- Season-bound activation.

Assignment должен быть детерминирован, аудируем и неизменяем в рамках
эксперимента.

## 21.4. Kill switches

Можно остановить:

- один Trigger Binding;
- одну Quest Edition;
- одну Achievement evaluation policy;
- один Battle Pass XP source;
- claim конкретной Reward;
- весь release bundle.

Kill switch не мутирует опубликованную Definition и не удаляет историю.

-------------------------------------------------------------------------

# 22. Аналитика и Content Health

## 22.1. Метрики

- impressions и eligible audience;
- Quest accepted, started, progressed, completed, expired;
- Achievement progress и unlock;
- Reward requested, granted, claimed, failed, reversed;
- Item acquired, equipped, consumed;
- Season enrollment и participation;
- Battle Pass tier distribution, free claim и premium claim;
- primary XP и pass XP rate;
- completion time;
- correction и duplicate rate;
- notification suppression;
- opt-out;
- support explanations;
- content error rate;
- cohort fairness.

## 22.2. Ограничения аналитики

- несовершеннолетние private by default;
- минимальный размер cohort до отображения;
- отсутствие публичного сравнения детей;
- аналитика не становится authoritative ledger;
- PII не экспортируется вместе с игровыми метриками;
- скрытый контент не раскрывается через названия метрик.

## 22.3. Alerts

- reward failure;
- недостижимый Quest;
- аномально высокий XP rate;
- резкий провал completion;
- broken asset;
- dependency retired;
- Season activation blocked;
- Battle Pass tier unreachable;
- premium entitlement mismatch;
- correction backlog;
- cross-tenant access attempt.

-------------------------------------------------------------------------

# 23. Нефункциональные требования

## 23.1. Производительность

- catalog first page p95 не более 2 секунд при штатной нагрузке;
- открытие editor p95 не более 2 секунд без загрузки тяжёлого media;
- autosave acknowledgement p95 не более 1 секунды;
- локальная structural validation не более 500 мс;
- серверная обычная validation p95 не более 10 секунд;
- длительная simulation выполняется как job с progress и cancel;
- bulk import 10 000 строк не блокирует интерактивную работу.

## 23.2. Надёжность

- идемпотентные create, publish, schedule и rollback commands;
- optimistic concurrency;
- durable jobs;
- resumable compilation;
- audit и outbox;
- backup и restore drill;
- отсутствие Active partial bundle.

## 23.3. Доступность

- WCAG 2.2 AA для основных рабочих сценариев;
- полная клавиатурная навигация;
- screen-reader labels;
- цвет не является единственным сигналом статуса;
- reduced-motion preview;
- масштаб 200 процентов без потери функций.

## 23.4. Совместимость

- desktop-first web;
- рабочий tablet view для review, approval и emergency pause;
- последние две major versions основных браузеров;
- expert API не заменяет обязательный UI.

-------------------------------------------------------------------------

# 24. Измеримое удобство

На usability-тесте с не менее чем пятью представителями партнёра:

1. не менее 80 процентов создают типовой weekly Quest из шаблона, валидируют и
   отправляют на review без помощи;
2. медианное активное время задачи не превышает 10 минут без подготовки asset;
3. не менее 80 процентов создают tiered Achievement без ошибочного понимания
   Definition и tier;
4. reviewer находит изменение Reward quantity через version diff;
5. publisher определяет blocker до попытки activation;
6. никто не может случайно выдать production Reward из Preview или Simulation;
7. критические usability errors отсутствуют;
8. все destructive или high-risk действия показывают target, scope и impact.

Целевой показатель после обучения:

- простой Quest Draft — до 5 минут;
- простое Achievement — до 5 минут;
- Item или Title — до 5 минут без создания media;
- Reward Bundle — до 10 минут;
- Season из шаблона — до 20 минут;
- Battle Pass на 50 tiers из шаблона и импортированной reward matrix — до
  60 минут без производства media.

-------------------------------------------------------------------------

# 25. API и интеграционные требования

Studio BFF ДОЛЖЕН предоставлять:

- catalog query;
- Draft CRUD;
- validation;
- simulation jobs;
- review comments;
- approvals;
- compilation;
- bundle publication;
- activation scheduling;
- pause и rollback;
- import/export jobs;
- asset и localization management;
- audit query;
- analytics query.

Требования:

- authenticated actor;
- tenant и realm из trusted context;
- idempotency key для commands;
- expected draft revision;
- correlation и causation IDs;
- reason для privileged actions;
- pagination и stable sorting;
- bounded filters;
- rate limits;
- canonical error codes;
- no existence leakage across tenant.

Studio общается с Engine только через зарегистрированные authoring,
validation, immutable lookup и command contracts.

-------------------------------------------------------------------------

# 26. Безопасность и приватность

- MFA для Publisher, Owner и Platform Operator;
- tenant-scoped RBAC;
- least privilege;
- CSRF, XSS и upload protection;
- signed and expiring asset access;
- encryption in transit и at rest;
- secret and embargo protection;
- audit privileged reads;
- reason и approval reference;
- data retention policy;
- legal hold;
- export watermarking для hidden content, если требуется;
- no public minors data by default;
- guardian policy не редактируется через content rule;
- support impersonation запрещён; используется audited view-as projection.

Threat model включает:

- malicious content author;
- compromised publisher;
- cross-tenant key guessing;
- hidden reward disclosure;
- dependency substitution;
- asset replacement;
- formula amplification;
- recursive reward loop;
- replay publication;
- CSV formula injection;
- spreadsheet macro;
- oversized upload;
- stale approval after Draft edit.

-------------------------------------------------------------------------

# 27. Audit

Audit записывает:

- actor и effective role;
- tenant, realm и module;
- command;
- entity и revision;
- before/after semantic diff;
- reason;
- validation report;
- approval references;
- publication attempt;
- Engine results;
- bundle fingerprint;
- activation;
- pause;
- rollback;
- export и hidden content access;
- temporary support access.

Audit append-only, доступен по разрешению и экспортируется для расследования.

-------------------------------------------------------------------------

# 28. Ошибки и explainability

Каждая ошибка содержит:

- стабильный error code;
- severity;
- affected entity;
- field path;
- человекочитаемое объяснение;
- техническую причину для support;
- безопасное исправление;
- blocking/non-blocking;
- owner, если требуется внешнее действие.

Примеры:

- CONTENT_DEPENDENCY_NOT_PUBLISHED;
- CONTENT_REACTIVE_CYCLE;
- EVENT_FIELD_NOT_ALLOWLISTED;
- REWARD_COMPONENT_OWNER_MISSING;
- PASS_TIER_THRESHOLD_NOT_INCREASING;
- PREMIUM_SCHOOL_REWARD_NOT_ALLOWED;
- MINOR_VISIBILITY_POLICY_VIOLATION;
- BUSINESS_REFERENCE_RETIRED;
- SAFETY_EVENT_CONTRACT_MISSING;
- APPROVAL_STALE_AFTER_EDIT;
- BUNDLE_PARTIAL_PUBLICATION;
- TENANT_SCOPE_MISMATCH.

-------------------------------------------------------------------------

# 29. MVP

## 29.1. Обязательные типы сущностей

- Workspace и Template;
- Quest и Campaign;
- Achievement и tiers;
- Reward Definition, Components и Trigger Binding;
- Item, Title, Collection и Skin Set;
- Season Definition, Edition и Content Binding;
- free Battle Pass;
- optional premium cosmetic lane за feature flag;
- Level Milestone Binding;
- Mastery Rank Recognition Binding;
- Notification/Receipt presentation;
- Asset и Localization;
- Release Bundle и Activation Plan.

Talent authoring может войти в Phase 2, но dependency preview для уже
опубликованных Talent обязателен в MVP.

## 29.2. Обязательные пользовательские возможности

- create from template;
- clone;
- form editor;
- no-code rule builder;
- XLSX/CSV import;
- validation;
- student/guardian preview;
- synthetic simulation;
- comments;
- approval;
- publish;
- schedule;
- pause;
- rollback;
- audit;
- content health.

## 29.3. MVP не считается готовым, если

- контент публикуется только через ручное редактирование YAML разработчиком;
- один партнёр может увидеть ключи другого tenant;
- published version редактируется;
- simulation создаёт runtime effects;
- Battle Pass хранит progress в Studio;
- premium lane может выдать школьное функциональное преимущество;
- correction policy отсутствует для посещения;
- rollback удаляет earned state;
- safety blocker можно проигнорировать без зарегистрированного approval policy.

-------------------------------------------------------------------------

# 30. Приёмочные сценарии

## A1. Weekly Quest

Author создаёт weekly Quest из шаблона, выбирает подтверждённое посещение,
порог два, bounded XP Reward и отправляет на review.

Ожидается:

- key в tenant namespace;
- typed predicate;
- correction policy;
- preview;
- low/typical/high simulation;
- публикация через immutable bundle.

## A2. Tiered Achievement

Author создаёт Achievement посещений с порогами 1, 10, 25, 50 и 100.

Ожидается одна Definition и пять tiers, а не пять несвязанных определений.

## A3. Title

Author создаёт Title и связывает его с mastery Rank 10.

Ожидается COSMETIC Item subtype TITLE, Reward binding и выбор в Character
presentation только после Inventory acquisition.

## A4. Item family

Author создаёт десять rank seals для одного оружия.

Ожидается dry-run с десятью стабильными keys, отсутствие duplicate и точные
Achievement/Reward dependencies.

## A5. School Season

Content Manager создаёт учебный год из четырёх фаз и связывает Quest Campaign.

Ожидается отдельная Season Edition, UTC schedule, Europe/Moscow presentation,
grace policy и acknowledged bindings.

## A6. Free Battle Pass

Author создаёт 50-tier сезонный путь.

Ожидается отдельный pass Progression Track, бесплатная lane, строго
возрастающие thresholds, Quest sources, Reward definitions и один bundle.

## A7. Premium Lane

Author добавляет premium lane.

Ожидается High Risk, guardian/commerce review, entitlement reference,
ретроактивная policy и блокировка primary XP, mastery и functional Talent.

## A8. Missing Safety Contract

Author выбирает safety briefing condition.

Ожидается blocker SAFETY_EVENT_CONTRACT_MISSING и отсутствие publication.

## A9. Duplicate Event

Simulation доставляет одно attendance event дважды.

Ожидается один логический Quest progress и один Reward effect.

## A10. Correction

После выданной Reward посещение исправлено.

Ожидается отображение configured correction/reversal outcome без удаления
истории.

## A11. Dependency Cycle

Quest награждает Item, Achievement требует Item и Reward повторно запускает тот
же Quest.

Ожидается публикационный blocker и визуальный cycle path.

## A12. Rollback

После запуска обнаружен неверный Reward amount.

Ожидается остановка нового Binding, активация предыдущего bundle, сохранение
истории и отдельный correction workflow для уже выданных Reward.

## A13. Cross-tenant access

Author подставляет itemKey другого tenant.

Ожидается отказ без подтверждения существования чужого объекта и security
audit.

## A14. Spreadsheet import

Author импортирует 100 Items с одной ошибочной строкой.

Ожидается staging report, row-level error, отсутствие публикации и возможность
исправить только ошибочную строку.

## A15. Concurrent edit

Два автора изменяют один Draft.

Ожидается optimistic concurrency conflict, semantic diff и отсутствие
потерянного обновления.

## A16. Hidden Achievement

Student preview до unlock не раскрывает название и условие.

После unlock отображается разрешённая recognition presentation.

## A17. Minor privacy

Author пытается включить публичный share card для всех детей.

Ожидается safeguarding blocker и требование policy-compliant opt-in.

## A18. Battle Pass close

Season закрывается при незабранных наградах.

Ожидается поведение согласно claim/grace policy; полученные Items не удаляются.

-------------------------------------------------------------------------

# 31. Технические артефакты реализации

Команда должна предоставить:

- Studio information architecture;
- UX prototypes;
- Module Content Profile schema;
- Content Entity schema registry;
- condition AST schema;
- compiler contracts;
- Engine authoring adapters;
- bundle manifest schema;
- RBAC matrix;
- risk policy;
- validation codes catalog;
- import templates;
- preview fixtures;
- simulation fixtures;
- audit schema;
- analytics event catalog;
- runbooks pause, rollback и partial publication;
- automated acceptance suite.

-------------------------------------------------------------------------

# 32. School Content Profile v1 — итоговый allowlist

Партнёр школы может создавать:

1. Workspace.
2. Folder, Tag и Content Collection.
3. Content Template.
4. Audience Preset в пределах безопасных predicates.
5. Media Asset.
6. Localization Entry и Pack.
7. Season Definition.
8. Season Edition.
9. Season Phase и Window.
10. Season Participation/Eligibility Policy из presets.
11. Season Content Binding.
12. Battle Pass Blueprint и Edition.
13. Free Lane.
14. Premium cosmetic Lane по feature flag.
15. Pass Tier, Milestone, XP Source и Claim Policy.
16. Campaign.
17. Campaign Chapter и Quest Chain.
18. Quest Definition и Edition.
19. Quest Objective, Objective Group и Optional Objective.
20. Quest prerequisite, recurrence, eligibility, expiry и correction policy.
21. Achievement Definition.
22. Achievement Tier.
23. Hidden Achievement и Recognition Presentation.
24. Title Definition как специализированный Item.
25. Reward Definition.
26. Reward Bundle.
27. Reward Component из allowlist.
28. Reward Trigger Binding.
29. Claim, repeatability, duplicate, expiry, reversal и compensation policy из
    presets.
30. Item Definition разрешённого типа.
31. Avatar, Frame, Banner, Theme, Aura и Cosmetic Effect.
32. Trophy, Rank Seal, Tournament Crest и Anniversary Mark.
33. Collectible, Fragment, Emblem, Token и Monthly Die.
34. Access Token с registered consumer.
35. Cosmetic Consumable с registered consumer.
36. Quest Item.
37. Item Collection и Item Set.
38. Cosmetic Skin Set.
39. Collection Completion Rule и Reward.
40. Talent Tree, Node и Rank после включения Phase 2.
41. Level Milestone Binding и Celebration.
42. Mastery Rank Recognition Binding.
43. Rank Seal Family и Weapon Achievement Family.
44. Notification Template.
45. In-product Receipt и Celebration Template.
46. Reminder Content и privacy-safe Share Card.
47. Release Bundle.
48. Activation Plan, schedule, canary, pause и rollback.

Партнёр школы не может создавать через Studio:

- новые Engine;
- Event Types;
- Reward Component Types;
- Item Types;
- Talent Effect Contracts;
- основную Level curve;
- формулу weapon mastery;
- посещение или Training Record;
- платёжный продукт;
- игровую валюту;
- физическое fulfillment;
- произвольный код;
- публичный детский leaderboard.

-------------------------------------------------------------------------

# 33. Открытые вопросы перед версией 1.0

1. Нужен ли premium Battle Pass школе на первом запуске или только free path?
2. Какой Entitlement owner обслуживает premium lane?
3. Как называется pass experience в пользовательском интерфейсе школы?
4. Сколько tiers и какая целевая длительность первого pass?
5. Какой лимит primary XP может настраивать партнёр без platform approval?
6. Какие Reward Components разрешены школьному Author по умолчанию?
7. Кто выполняет Coach и Safeguarding review?
8. Требуется ли отдельная юридическая проверка paid content для детей?
9. Какой Event подтверждает safety briefing?
10. Какие business entities доступны Rule Builder как predicates?
11. Нужен ли partner-created Audience Preset в MVP или только готовые presets?
12. Кто владеет Notification Engine в первой реализации?
13. Какие locales обязательны?
14. Какой набор asset licenses допустим?
15. Нужна ли preview-среда на реальных staff Characters или только synthetic?
16. Какие типы canary допустимы для Season и paid pass?
17. Как исправляются уже выданные ошибочные premium rewards?
18. Какие analytics доступны партнёру без риска раскрытия данных детей?
19. Нужна ли интеграция с CMS для narrative pages?
20. Какие сущности после проверки школы войдут в универсальный базовый профиль?

-------------------------------------------------------------------------

# 34. Definition of Done

Partner Content Studio готов к school.fencing, когда:

1. Module Content Profile опубликован и содержит allowlist типов, событий,
   predicates, компонентов, эффектов и лимитов.
2. Все MVP-редакторы работают без ручного изменения Engine database.
3. Battle Pass компилируется без нового владельца runtime progress.
4. Standard Level 1–100 защищён от изменения партнёром.
5. Tenant isolation доказана тестами.
6. Published Definitions неизменяемы.
7. Все составные сущности публикуются одним целостным bundle.
8. Validation, dependency graph и simulation объясняют результат.
9. Coach и safeguarding gates работают.
10. Import создаёт только Draft.
11. Pause и rollback проверены на production-like стенде.
12. Duplicate, correction, late event и partial failure tests проходят.
13. Audit связывает UI action, Control Plane command и Engine result.
14. Usability criteria выполнены.
15. Полный школьный каталог из раздела 32 доступен или явно отложен решением
    Phase 2 с владельцем и сроком.
