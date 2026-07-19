---
document: school-fencing-content-pack
title: Fencing School Starter Content Pack
owner: School Game Design
status: Proposed
version: 1.0.0
last_updated: 2026-07-18
depends_on:
  - school-fencing-progression-mastery
  - 005-reward-engine
  - 006-achievement-engine
  - 007-quest-engine
  - 008-talent-engine
  - 009-item-engine
  - 010-inventory-engine
  - 011-season-engine
---

# Starter Content Pack

## Content Principles

- reward consistency, learning, safety and community;
- never require unsafe repetition, heavier equipment or unnecessary spending;
- do not turn payment, sickness or attendance correction into shame;
- make primary progression visible while weapon mastery remains meaningful;
- give cosmetics and recognition more often than commercial value;
- keep minors private by default;
- use immutable Definitions and exact release-bundle versions;
- all Russian display text is localization content, not stable identity.

------------------------------------------------------------------------

# Reward Bundles

| rewardKey | Components | Typical source |
|---|---|---|
| `school.fencing.reward.welcome` | 300 XP, starter avatar choice | onboarding |
| `school.fencing.reward.first_training` | 500 XP, “First Salute” badge | first attendance |
| `school.fencing.reward.training_attendance` | 500 XP | eligible session attendance |
| `school.fencing.reward.weekly_rhythm` | 300 XP, one manuscript fragment | weekly quest |
| `school.fencing.reward.monthly_discipline` | 1,000 XP, seasonal cosmetic | monthly quest |
| `school.fencing.reward.weapon_rank_minor` | 750 XP, weapon seal trophy | Ranks 1-3 |
| `school.fencing.reward.weapon_rank_major` | 1,500 XP, frame or banner | Ranks 4-7 |
| `school.fencing.reward.weapon_rank_master` | 3,000 XP, animated-safe cosmetic, title | Ranks 8-10 |
| `school.fencing.reward.event_participant` | 500 XP, event collectible | school event |
| `school.fencing.reward.mentor` | 750 XP, title progress | verified mentoring quest |
| `school.fencing.reward.level_milestone` | Item or cosmetic only | Level milestone |
| `school.fencing.reward.referral` | reviewed voucher Item, no automatic XP | qualified referral |

“Animated-safe” means reduced-motion fallback is mandatory.

No Reward bundle includes real money. A commercial voucher is an Item or
Commerce entitlement with explicit consumer and expiration policy.

------------------------------------------------------------------------

# Quest Catalog

## Onboarding Campaign: Path of the Student

| questKey | Display title | Completion condition | Reward |
|---|---|---|---|
| `path.profile` | Лист персонажа | active Character association and completed safe profile | welcome bundle |
| `path.safety` | Сначала безопасность | coach confirms safety briefing | 300 XP, safety badge |
| `path.first_trial` | Первый выход в зал | trial attendance confirmed | 300 XP |
| `path.first_training` | Первый салют | first regular attendance | first-training bundle |
| `path.first_record` | Запись в хронике | first confirmed Training Record | 300 XP |
| `path.choose_weapon` | Выбери путь | first positive allocation to any weapon | 250 XP |
| `path.monthly_roll` | Бросок судьбы | first valid monthly d8 roll | 150 XP, die collectible |
| `path.open_inventory` | Арсенал героя | open Inventory and inspect an acquired Item | 100 XP |
| `path.choose_cosmetic` | Собственный герб | activate one entitled profile cosmetic | 100 XP |
| `path.complete` | Путь начат | all prior onboarding quests completed | 1,000 XP, “Student of the Hall” frame |

The campaign has no expiry for an active student.

## Training-Day Quests

| questKey | Title | Condition | Reward | Limit |
|---|---|---|---:|---|
| `training.ready` | Готовность | one eligible attendance | 100 XP | once per local date |
| `training.focus` | Технический фокус | coach confirms one curriculum objective | 150 XP | once per session |
| `training.balance` | Обе стороны | approved exercise has both configured sides where curriculum requires it | 100 XP | once per session |
| `training.partner` | Работа в паре | coach confirms approved partner drill | 150 XP | once per session |
| `training.reflection` | Страница хроники | complete bounded post-session reflection | 100 XP | twice per week |

These are optional additions to attendance XP and remain under the daily Reward
cap. A curriculum that is one-sided does not expose `training.balance`.

## Weekly Quests

| questKey | Title | Condition | Reward |
|---|---|---|---|
| `weekly.rhythm.2` | Держать ритм | attend two sessions in one school week | weekly-rhythm bundle |
| `weekly.rhythm.3` | Три шага вперёд | attend three sessions in one school week | 500 XP |
| `weekly.two_paths` | Два пути | receive positive mastery allocation in two weapon tracks | 400 XP |
| `weekly.curriculum` | Урок мастера | complete three distinct approved curriculum objectives | 400 XP |
| `weekly.history` | След Мароццо | complete one educational card or glossary quest | 250 XP |
| `weekly.community` | Товарищ по залу | complete a coach-assigned safe partner or welcome activity | 300 XP |
| `weekly.event_prep` | Перед событием | complete an event preparation checklist | 300 XP |

Only one of `weekly.rhythm.2` and `weekly.rhythm.3` pays the rhythm Reward;
the higher completed tier replaces the lower result.

## Monthly Quests

| questKey | Title | Condition | Reward |
|---|---|---|---|
| `monthly.roll` | Восемь граней | complete the valid d8 roll | 150 XP |
| `monthly.sessions.8` | Дисциплина месяца | eight eligible sessions | monthly-discipline bundle |
| `monthly.new_path` | Новый клинок | first approved use of a previously unopened track | 500 XP |
| `monthly.consistency` | Без спешки, без перерыва | eligible attendance in three distinct weeks | 750 XP |
| `monthly.event` | Жизнь школы | participate in one registered school event | event-participant bundle |

## Seasonal Campaign: Eight Paths

Eight chapters unlock in canonical weapon order. Each chapter contains:

1. an educational history or terminology card;
2. a safety and equipment knowledge check;
3. a coach-confirmed introductory curriculum objective;
4. positive mastery allocation in the chapter weapon;
5. an optional community or event objective.

A chapter grants 1,000 XP and its weapon emblem. Completing all eight grants
3,000 XP, the “Eight Paths” banner and the `eight_paths` title entitlement.

The campaign never requires reaching Rank 1 in all eight weapons during one
Season.

------------------------------------------------------------------------

# Achievement Catalog

## Foundational Achievements

| achievementKey | Display title | Condition | Reward |
|---|---|---|---|
| `start.first_salute` | Первый салют | first regular attendance | badge |
| `start.safety` | Береги себя и партнёра | safety briefing confirmed | safety badge |
| `start.character` | Герой вступает в зал | Character association active | starter avatar |
| `start.inventory` | Первый трофей | first Item acquired | 250 XP |
| `start.quest` | Задание выполнено | first Quest completed | 250 XP |
| `start.event` | Часть школы | first registered event participation | event collectible |

## Attendance and Consistency

| achievementKey | Tiers | Condition | Reward pattern |
|---|---|---|---|
| `practice.sessions` | 1, 10, 25, 50, 100, 250, 500 | eligible sessions | 250-3,000 XP, frames at 50/100/250 |
| `practice.weeks` | 4, 12, 26, 52 | weeks with at least two eligible sessions | banners and titles |
| `practice.years` | 1, 3, 5, 10 | association anniversary with active participation | anniversary trophy; no hidden health inference |
| `practice.return` | single | first eligible session after a voluntary break | supportive cosmetic, no public “absence” label |

Streaks use completed weeks and allow configured grace; they do not expose a
daily-login obligation.

## Weapon Mastery

Each weapon has one ten-tier meta-achievement:

```text
mastery.<weaponKey>.rank.<1..10>
```

| Tier group | Recognition |
|---|---|
| Ranks 1-3 | bronze/silver/steel weapon seals |
| Ranks 4-7 | weapon-specific frame stages |
| Ranks 8-9 | animated-safe weapon aura and title variant |
| Rank 10 | master seal, banner and permanent title |

Additional achievements:

| achievementKey | Title | Condition | Reward |
|---|---|---|---|
| `mastery.first_rank` | Первый знак | Rank 1 in any weapon | 750 XP, seal |
| `mastery.four_paths` | Четыре пути | Rank 1 in four distinct weapons | 1,500 XP, quartered frame |
| `mastery.eight_paths` | Универсальный воин | Rank 1 in all eight weapons | 3,000 XP, Eight Paths banner |
| `mastery.two_rank_five` | Две школы | Rank 5 in two weapons | 3,000 XP, dual emblem |
| `mastery.one_rank_ten` | Мастер оружия | Rank 10 in one weapon | master reward bundle |
| `mastery.all_rank_ten` | Мастер Меча | Rank 10 in all eight weapons | great Achievement, unique cosmetic set |

The great Achievement requires manual integrity review before public display.

## Curriculum and Community

| achievementKey | Tiers or condition | Reward |
|---|---|---|
| `curriculum.objectives` | 10, 25, 50, 100 distinct verified objectives | manuscript collection stages |
| `curriculum.marozzo` | complete Marozzo educational collection | “Student of Marozzo” title |
| `community.events` | 1, 5, 10, 25 events | event frames |
| `community.mentor` | 5 verified newcomer-support quests | “Companion” title |
| `community.tournament` | first registered school tournament | tournament crest |
| `community.masterclass` | first master class | master-class collectible |

Achievements never depend on payment amount, public popularity, medical status
or coach payroll.

------------------------------------------------------------------------

# Item Types and Inventory Policy

| Item Type | School use | Default semantics |
|---|---|---|
| `COSMETIC` | avatar, frame, banner, profile theme, weapon aura | unique, bound, non-transferable |
| `TROPHY` | rank seal, tournament crest, anniversary mark | unique, permanent unless integrity invalidation |
| `COLLECTIBLE` | manuscript fragment, event token, monthly die | stack or unique by Definition |
| `ACCESS_TOKEN` | guest pass, master-class invitation, approved voucher | expiring, bound, consumed by registered school owner |
| `CONSUMABLE` | cosmetic dye or one-use presentation effect | stackable only when Definition permits |
| `QUEST_ITEM` | temporary chapter evidence | campaign-bound, expires by Quest policy |

Inventory ownership never proves physical delivery. A real sash, weapon,
uniform or printed certificate requires a separate school fulfillment record.

------------------------------------------------------------------------

# Starter Item Collection

## Avatars

| itemKey | Name | Acquisition |
|---|---|---|
| `school.fencing.avatar.novice` | Новобранец | starter choice |
| `school.fencing.avatar.scholar` | Ученик трактата | onboarding completion |
| `school.fencing.avatar.duelist` | Дуэлянт | Rank 3 in one sword track |
| `school.fencing.avatar.shieldbearer` | Щитоносец | Rank 3 in a shield track |
| `school.fencing.avatar.polearm` | Мастер древкового оружия | Rank 3 in a polearm track |
| `school.fencing.avatar.universal` | Универсальный воин | Rank 1 in all eight tracks |

## Frames

| itemKey | Name | Acquisition |
|---|---|---|
| `school.fencing.frame.hall` | Герб зала | starter |
| `school.fencing.frame.bronze` | Бронзовый орнамент | first Rank |
| `school.fencing.frame.steel` | Стальной орнамент | Level 20 |
| `school.fencing.frame.crimson` | Багряная стража | 100 sessions |
| `school.fencing.frame.manuscript` | Поля трактата | Marozzo collection |
| `school.fencing.frame.eight_paths` | Восемь путей | seasonal campaign |

## Banners and Themes

| itemKey | Name | Acquisition |
|---|---|---|
| `school.fencing.banner.night_hall` | Ночной зал | Level 30 |
| `school.fencing.banner.manuscript_1536` | Трактат 1536 | educational campaign |
| `school.fencing.banner.arsenal` | Арсенал | acquire eight weapon seals |
| `school.fencing.banner.eight_paths` | Восемь путей | campaign completion |
| `school.fencing.theme.parchment` | Пергамент | Level 15 |
| `school.fencing.theme.steel` | Сталь | Level 50 |

## Titles

| resourceKey | Display title | Acquisition |
|---|---|---|
| `school.fencing.title.student` | Ученик зала | onboarding completion |
| `school.fencing.title.marozzo_student` | Ученик Мароццо | educational collection |
| `school.fencing.title.steadfast` | Стойкий | 26 consistent weeks |
| `school.fencing.title.companion` | Товарищ по залу | mentoring Achievement |
| `school.fencing.title.weapon_master` | Мастер оружия | Rank 10 in one weapon |
| `school.fencing.title.eight_paths` | Восемь путей | Rank 1 in all weapons |
| `school.fencing.title.master_of_sword` | Мастер Меча | Rank 10 in all weapons |

Starter titles are published as `COSMETIC` Item Definitions. Inventory Engine
owns their entitlement, and Character Engine owns only the selected title
reference. A future dedicated entitlement owner requires a migration ADR.

## Trophies and Collectibles

- ten rank-seal stages per weapon, generated as explicit Item Definitions;
- eight weapon emblems;
- `school.fencing.collectible.monthly_die`;
- twelve seasonal manuscript fragments;
- event-specific crests with immutable Edition references;
- anniversary marks for 1, 3, 5 and 10 years.

------------------------------------------------------------------------

# Cosmetic Skin Sets

## Manuscript of Marozzo

Visual language: parchment, ink, red rubrication, geometric diagrams and
restrained metallic accents.

Contents:

- avatar background;
- frame;
- profile banner;
- eight weapon emblems;
- title treatment;
- reduced-motion page-turn effect.

## Night Hall

Visual language: dark blue, warm training light, subtle floor markings and
silhouettes. No realistic injury or combat imagery.

Contents:

- banner;
- frame;
- profile theme;
- static and reduced-motion variants.

## Eight Paths

Visual language: eight color-coded weapon symbols joined in one circular crest.

Contents:

- universal avatar;
- frame;
- banner;
- title treatment;
- collection page;
- optional aura with non-animated fallback.

Every asset has age rating, contrast check, localization-safe crop, alt text,
ownership license, content hash and fallback.

------------------------------------------------------------------------

# Talent Forest: Activity Trees

Talents unlock optional content and presentation utility. They do not multiply
physical load, payment Rewards or primary training Experience.

Three equal trees (36 talents total). UI grid follows the OnlyGames profile
contract: fixed **6×7** matrix, root at `[5,3]`, growth bottom-up, unlock via
`requires` graph. Each tree has **9 passives** and **3 actives** with cooldowns
**1 day / 7 days / 30 days** (`86400` / `604800` / `2592000` seconds).

| treeId | Bundle key | Display title | Theme |
|---|---|---|---|
| `arsenal.paths` | `school.fencing.arsenal.v1` | Путь клинка | оружие, техники, навыки |
| `wolf.brotherhood` | `school.fencing.wolf.v1` | Братство Волка | сообщество (эстетика Ведьмака) |
| `codex.lore` | `school.fencing.codex.v1` | Кодекс | знания, теория, стратегия |

Братство Волка uses Witcher flavour (Каэр Морхен, Путь, медальон, контракты)
for school-safe community activities only. No mutations, Trial of the Grasses,
hunting, or cruelty.

## Путь клинка (`arsenal.*`)

| talentKey | Rank | Kind | CD | Effect |
|---|---:|---|---|---|
| `arsenal.daily_focus` | 1 | ACTIVE | 1д | Активирует одно опциональное задание на технический фокус на текущие локальные сутки |
| `arsenal.stance` | 1 | PASSIVE | — | Открывает вводные подсказки учебной программы по каждому открытому оружейному пути |
| `arsenal.guard` | 1 | PASSIVE | — | Открывает личные подсказки рефлексии о дистанции и тайминге после тренировки |
| `arsenal.both_sides` | 1 | PASSIVE | — | Подсказка о доступности упражнений на обе стороны, если того требует программа |
| `arsenal.weekly_review` | 1 | ACTIVE | 7д | Открывает структурированный личный разбор техники за последнюю неделю |
| `arsenal.partner_drill` | 1 | PASSIVE | — | Открывает опциональную цепочку заданий «работа в паре» |
| `arsenal.weapon_focus` | 1 | PASSIVE | — | Открывает еженедельный путь заданий с акцентом на одно оружие |
| `arsenal.cross_training` | 1 | PASSIVE | — | После открытия двух путей открывает опциональную цель «второй путь на этой неделе» |
| `arsenal.form_reader` | 1 | PASSIVE | — | Открывает карточки наблюдения техники по пройденной программе |
| `arsenal.seal_keeper` | 1 | PASSIVE | — | Открывает раскладку коллекции оружейных печатей в профиле |
| `arsenal.master_path` | 1 | PASSIVE | — | Завершающий узел; косметический набор «Путь клинка», без модификатора опыта |
| `arsenal.monthly_path` | 1 | ACTIVE | 30д | Один раз меняет отображаемый акцент оружия и открывает превью главы «догоняющего» пути (без опыта) |

## Братство Волка (`wolf.*`)

| talentKey | Rank | Kind | CD | Effect |
|---|---:|---|---|---|
| `wolf.daily_call` | 1 | ACTIVE | 1д | Одна безопасная карточка приглашения на пробное занятие или событие (с учётом согласия) |
| `wolf.hearth` | 1 | PASSIVE | — | Даёт доступ к заданиям приветствия и парной работы, которые назначает тренер |
| `wolf.contract_prep` | 1 | PASSIVE | — | Открывает задания-чеклисты подготовки к мероприятию |
| `wolf.medallion` | 1 | PASSIVE | — | Открывает настройки напоминаний о школьных событиях |
| `wolf.weekly_fire` | 1 | ACTIVE | 7д | Открывает еженедельное сообщественное задание (пара / приветствие), если оно ещё не взято |
| `wolf.brother` | 1 | PASSIVE | — | Даёт доступ к наставническим заданиям, которые назначает тренер |
| `wolf.recruit` | 1 | PASSIVE | — | Открывает путь квалифицированного реферала (ваучер только после проверки, без авто-опыта) |
| `wolf.keeper` | 1 | PASSIVE | — | Даёт доступ к волонтёрским заданиям на мероприятиях |
| `wolf.tourney` | 1 | PASSIVE | — | Открывает контент подготовки к школьному турниру |
| `wolf.master_lesson` | 1 | PASSIVE | — | Открывает подготовку к мастер-классу и шаблоны рефлексии |
| `wolf.grandmaster` | 1 | PASSIVE | — | Завершающий узел; косметический набор «Братство Волка» |
| `wolf.monthly_council` | 1 | ACTIVE | 30д | Открывает доступ к главе сезонной кампании сообщества или к подсветке события |

## Кодекс (`codex.*`)

| talentKey | Rank | Kind | CD | Effect |
|---|---:|---|---|---|
| `codex.daily_card` | 1 | ACTIVE | 1д | Выдаёт одну образовательную карточку или задание глоссария на сутки |
| `codex.glossary` | 1 | PASSIVE | — | Открывает задание по глоссарию и терминологии |
| `codex.marozzo` | 1 | PASSIVE | — | Открывает путь образовательной коллекции Мароццо |
| `codex.scholar` | 1 | PASSIVE | — | Открывает расширенные исторические карточки |
| `codex.weekly_study` | 1 | ACTIVE | 7д | Открывает главу продвинутой учебной цепочки заданий на неделю |
| `codex.chronicler` | 1 | PASSIVE | — | Открывает шаблоны структурированной личной рефлексии |
| `codex.strategist` | 1 | PASSIVE | — | Открывает еженедельные подсказки плана обучения (только отображение) |
| `codex.pathfinder` | 1 | PASSIVE | — | Открывает второй опциональный путь заданий в неделю |
| `codex.archivist` | 1 | PASSIVE | — | Расширяет личную визуализацию истории мастерства |
| `codex.curator` | 1 | PASSIVE | — | Открывает дополнительный слот косметического пресета |
| `codex.master` | 1 | PASSIVE | — | Завершающий узел; косметический набор «манускрипт» |
| `codex.monthly_campaign` | 1 | ACTIVE | 30д | Открывает или продвигает доступ к образовательной главе «Восемь путей» (без требования ранга) |

## Grid layout (6×7)

Shared skeleton for all three trees (OnlyGames Gamer shape + two slots):

```text
col→   0  1  2  3  4  5  6
r0     .  .  A  .  B  .  C
r1     .  D  .  E  .  .  .
r2     .  .  F  .  G  .  .
r3     .  .  .  H  .  .  .
r4     .  .  I  .  J  .  K
r5     .  .  .  R  .  .  .
```

- `R` = daily active at `[5,3]`; `H` = weekly active at `[3,3]`; `C` = monthly active at `[0,6]`.
- Requires (bottom-up, per tree): `I,J,K←[R]`; `H←[R,I,J]`; `F,G←[R,I,J,H]`;
  `D,E←[R,I,J,H,F,G]`; `A←[R,I,J,H,F,G,D,E]`; `B←[A]`; `C←[A,B]`.

Exact `position` / `requires` bindings are published in the starter content bundle.

Implementation may use Talent acquisition and Skill activation facts as Quest
eligibility. Any new feature-effect contract must be registered before
activation; unsupported effects fail publication.

------------------------------------------------------------------------

# Season Definition

`school.fencing.academic_year.v1` provides temporal context, not school
schedule ownership.

Edition structure:

| Edition | Suggested window | Content |
|---|---|---|
| Autumn Assembly | September-November | onboarding, consistency and first four weapon chapters |
| Winter Discipline | December-February | indoor events, educational collection and seasonal cosmetics |
| Spring Tournament | March-May | event campaign, remaining weapon chapters and community quests |
| Summer Practice | June-August | flexible attendance, master classes and catch-up paths |

Exact dates are published per Edition. School Sessions remain in Scheduling;
Season Engine binds content availability and participation.

Seasonal progress never deletes permanent Achievements, Items, Level or earned
Mastery Rank.

------------------------------------------------------------------------

# Level Milestone Content

| Level | Reward |
|---:|---|
| 5 | starter frame color choice |
| 10 | title `student`, one manuscript fragment |
| 15 | parchment theme |
| 20 | steel frame |
| 25 | second trophy display slot eligibility |
| 30 | Night Hall banner |
| 40 | weapon-emblem display layout |
| 50 | steel theme and milestone trophy |
| 60 | advanced profile banner variant |
| 75 | animated-safe frame plus static fallback |
| 90 | master palette |
| 100 | unique Level 100 crest and permanent title treatment |

Milestone Rewards contain no Experience and cannot trigger recursive
Level-up loops.

------------------------------------------------------------------------

# Notifications and UX

Large celebrations:

- Level changed;
- Achievement unlocked;
- Mastery Rank changed;
- campaign completed.

Small receipts:

- Experience applied;
- Quest objective progressed;
- Item acquired;
- Mastery points applied.

Rules:

- group simultaneous receipts;
- provide reduced-motion and quiet-mode settings;
- explain source with safe localization keys;
- never reveal another student's progress;
- distinguish primary XP from weapon Mastery Points;
- show corrections and reversals without accusatory language;
- give the owner a private history and freshness timestamp.

------------------------------------------------------------------------

# Content Release Gates

- all stable keys are unique;
- every Reward Component has a registered owner;
- no circular Reward, Quest, Achievement, Talent or Item dependency exists;
- Experience caps and duplicate facts are tested;
- no Quest requires unsafe load or payment;
- every cosmetic has complete assets and fallback;
- minors visibility is private;
- every access token has consumer, expiration and reversal behavior;
- all content is pinned into one release bundle;
- simulation covers low-, typical- and high-frequency students;
- coach, safeguarding, product and platform owners approve activation.
