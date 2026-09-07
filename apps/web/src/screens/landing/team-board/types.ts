export const ROW_KEYS = ["row-1", "row-2", "row-3"] as const;
export const SIDES = ["sideA", "sideB"] as const;
export const SYMBOLS = ["star", "triangle", "hexagon", "rhombus", "cross"] as const;

export type RowKey = (typeof ROW_KEYS)[number];
export type SideId = (typeof SIDES)[number];
export type CardSymbol = (typeof SYMBOLS)[number];
export type CardZone = "hand" | "board";
export type GamePhase = "setup" | "playerTurn" | "botTurn" | "finished";
export type MatchOutcome = "win" | "loss" | "draw";
export type BoardMode = "explore" | "play";

export type BonusKind = "commander" | "vanguard" | "core" | "swarm" | "comeback";

export type SymbolDef = {
  symbol: CardSymbol;
  basePower: number;
  allowedRowKeys: readonly RowKey[];
};

export type TeamCard = {
  id: string;
  side: SideId;
  name: string;
  role: string;
  shortDescription: string;
  fullDescription: string;
  skills?: string[];
  badge?: string;
  mock?: boolean;
  initials: string;
  image: {
    src?: string;
    alt: string;
  };
  visual: {
    accent: string;
    symbol: CardSymbol;
  };
};

export type CardPlacement = {
  zone: CardZone;
  side: SideId;
  handOrder: number;
  rowId: string | null;
  rowOrder: number;
  allowedRows: string[];
  comebackBonus?: boolean;
};

export type RowDef = {
  id: string;
  side: SideId;
  key: RowKey;
  title: string;
  description: string;
};

export type DragState = {
  cardId: string;
  sourceRowId: string | null;
};

export type ExploreState = {
  selectedCardId: string | null;
  expandedCardId: string | null;
  activeSide: SideId;
  cards: Record<string, CardPlacement>;
  dragging: DragState | null;
};

export type GameMove = {
  cardId: string;
  rowId: string;
};

export type CardScore = {
  cardId: string;
  base: number;
  bonus: number;
  total: number;
  bonuses: { kind: BonusKind; amount: number }[];
};

export type RowResult = {
  rowKey: RowKey;
  sideA: number;
  sideB: number;
  winner: SideId | "draw";
  cards: { sideA: CardScore[]; sideB: CardScore[] };
};

export type MatchResult = {
  outcome: MatchOutcome;
  rowsWon: { sideA: number; sideB: number };
  totalPower: { sideA: number; sideB: number };
  rows: RowResult[];
};

export type GameState = {
  phase: GamePhase;
  matchId: string | null;
  moves: GameMove[];
  playerSide: SideId | null;
  firstSide: SideId | null;
  turn: number;
  selectedCardId: string | null;
  expandedCardId: string | null;
  activeSide: SideId;
  cards: Record<string, CardPlacement>;
  dragging: DragState | null;
  pendingCardId: string | null;
  result: MatchResult | null;
};

export type ExploreAction =
  | { type: "OPEN_CARD"; cardId: string }
  | { type: "CLOSE_CARD" }
  | { type: "PLAY_CARD"; cardId: string; rowId: string }
  | { type: "MOVE_CARD"; cardId: string; rowId: string }
  | { type: "RETURN_CARD"; cardId: string }
  | { type: "START_DRAG"; cardId: string }
  | { type: "END_DRAG" }
  | { type: "SET_ACTIVE_SIDE"; side: SideId }
  | { type: "RESET_BOARD" };

export type GameAction =
  | { type: "CHOOSE_SIDE"; side: SideId; firstSide: SideId; matchId: string }
  | { type: "OPEN_CARD"; cardId: string }
  | { type: "CLOSE_CARD" }
  | { type: "PLAY_CARD"; cardId: string; rowId: string }
  | { type: "MOVE_CARD"; cardId: string; rowId: string }
  | { type: "RETURN_CARD"; cardId: string }
  | { type: "CONFIRM_TURN" }
  | { type: "BOT_PLAY"; cardId: string; rowId: string }
  | { type: "FINISH_MATCH"; result: MatchResult }
  | { type: "START_DRAG"; cardId: string }
  | { type: "END_DRAG" }
  | { type: "SET_ACTIVE_SIDE"; side: SideId }
  | { type: "REMATCH"; firstSide: SideId; matchId: string }
  | { type: "BACK_TO_SETUP" };
