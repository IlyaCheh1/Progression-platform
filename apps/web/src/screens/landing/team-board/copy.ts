import type { BonusKind, CardSymbol, MatchOutcome, RowKey, SideId } from "./types.ts";

export const TEAM_COPY = {
  eyebrow: "Команда школы",
  title: "Расклад мастеров",
  subtitle: "Соберите линию школы и спарринг-сторону. Карты можно переставлять — это та же механика, что на OnlyGames.",
  gameSubtitle: "Шесть ходов, три ряда, одна карта за ход. Победа — по рядам, при равенстве по силе.",
  modeExplore: "Расклад",
  modePlay: "Дуэль",
  close: "Закрыть",
  skills: "Направления",
  chooseRow: "Выбрать ряд",
  moveCard: "Переставить",
  returnToHand: "Вернуть в руку",
  currentRow: "Сейчас в этом ряду",
  handEmpty: "Рука пуста",
  rowEmpty: "Пусто",
  resetBoard: "Сбросить расклад",
  swipeBoardHint: "Смахните влево или вправо, чтобы сменить сторону",
  switchSides: "Сторона доски",
  mockBadge: "Заглушка",
  mockHint: "Карта-заглушка. Данные появятся позже — это не сотрудник школы.",
  sides: {
    sideA: { title: "Школа", description: "Действующие мастера Master of the Sword и свободные места в составе." },
    sideB: { title: "Спарринг", description: "Шесть мест соперника. Пока заполнены заглушками." },
  },
  rows: {
    "row-1": { title: "Авангард", description: "Первая линия. Сильны треугольник и крест." },
    "row-2": { title: "Центр", description: "Опора строя. Бонус шестиугольнику." },
    "row-3": { title: "Резерв", description: "Глубина. Ромб усиливается соседями." },
  },
  game: {
    setupTitle: "Выберите сторону",
    setupCopy: "Школа — живые тренеры и две вакансии. Спарринг — шесть заглушек. Кто ходит первым, решает жребий.",
    youBadge: "Вы",
    botBadge: "Бот",
    confirmTurn: "Подтвердить ход",
    showResult: "Результат",
    rematch: "Ещё раз",
    changeSide: "Сменить сторону",
    rulesBadge: "Правила",
    ruleTurns: "6 ходов — по одной карте за ход.",
    ruleRows: "В ряду не больше трёх карт. Символ решает, куда можно поставить карту.",
    ruleFirst: "Первый ход определяет жребий.",
    ruleWin: "Сначала считают выигранные ряды, при равенстве — суммарную силу.",
    rowForbidden: "Сюда этот символ поставить нельзя",
    cardLocked: "Сейчас ходит другая сторона",
    pendingHint: "Карта стоит. Подтвердите ход или верните её в руку.",
  },
  symbols: {
    star: "Звезда — любой ряд. +1 за каждую другую звезду в ряду.",
    triangle: "Треугольник — ряды 1–2. +3 в авангарде.",
    hexagon: "Шестиугольник — ряды 1–2. +2 в центре.",
    rhombus: "Ромб — ряды 2–3. +1 за каждую другую карту в ряду.",
    cross: "Крест — ряды 1 и 3. +2, если ряд слабее ряда соперника в момент постановки.",
  } satisfies Record<CardSymbol, string>,
  bonuses: {
    commander: "Командир",
    vanguard: "Авангард",
    core: "Опора",
    swarm: "Рой",
    comeback: "Камбэк",
  } satisfies Record<BonusKind, string>,
  announce: {
    selected: (name: string) => `${name}`,
    played: (name: string, row: string) => `${name} → ${row}`,
    moved: (name: string, row: string) => `${name} переставлен в ${row}`,
    returned: (name: string) => `${name} вернулся в руку`,
    reset: "Расклад сброшен",
    startedYouFirst: "Вы ходите первым",
    startedBotFirst: "Бот ходит первым",
    botPlayed: (name: string, row: string) => `Бот: ${name} → ${row}`,
    win: "Победа",
    loss: "Поражение",
    draw: "Ничья",
  },
} as const;

export function sideTitle(side: SideId): string {
  return TEAM_COPY.sides[side].title;
}

export function rowTitle(key: RowKey): string {
  return TEAM_COPY.rows[key].title;
}

export function outcomeLabel(outcome: MatchOutcome): string {
  return TEAM_COPY.announce[outcome];
}

export function rowCountLabel(count: number): string {
  return String(count);
}

export function cardImageAlt(name: string, role: string): string {
  return `${name} — ${role}`;
}
