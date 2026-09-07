import { allowedRowsFor, cardSymbol, SYMBOL_DEFS } from "./symbols.ts";
import {
  ROW_KEYS,
  type CardPlacement,
  type CardScore,
  type MatchResult,
  type RowKey,
  type SideId,
  type TeamCard,
} from "./types.ts";

export const MAX_ROW_CARDS = 3;
export const MATCH_TURNS = 6;

export function oppositeSide(side: SideId): SideId {
  return side === "sideA" ? "sideB" : "sideA";
}

export function rowKeyOf(rowId: string): RowKey {
  const key = rowId.slice(rowId.indexOf("-") + 1) as RowKey;
  return ROW_KEYS.includes(key) ? key : "row-1";
}

export function cardsById(cards: TeamCard[]): Record<string, TeamCard> {
  return cards.reduce<Record<string, TeamCard>>((acc, card) => {
    acc[card.id] = card;
    return acc;
  }, {});
}

export function rowCardIds(
  placements: Record<string, CardPlacement>,
  side: SideId,
  rowKey: RowKey,
): string[] {
  const rowId = `${side}-${rowKey}`;
  return Object.entries(placements)
    .filter(([, card]) => card.zone === "board" && card.rowId === rowId)
    .sort(([, a], [, b]) => a.rowOrder - b.rowOrder)
    .map(([id]) => id);
}

export function nextRowOrder(placements: Record<string, CardPlacement>, rowId: string): number {
  return Object.values(placements).reduce(
    (max, card) => (card.zone === "board" && card.rowId === rowId ? Math.max(max, card.rowOrder + 1) : max),
    0,
  );
}

export function rowOccupancy(
  placements: Record<string, CardPlacement>,
  rowId: string,
  exceptCardId?: string,
): number {
  return Object.entries(placements).filter(
    ([id, card]) => id !== exceptCardId && card.zone === "board" && card.rowId === rowId,
  ).length;
}

export function canPlaceOnRow(
  state: { cards: Record<string, CardPlacement> },
  cardId: string,
  rowId: string,
): boolean {
  const placement = state.cards[cardId];
  if (!placement || !placement.allowedRows.includes(rowId)) return false;
  if (placement.zone === "board" && placement.rowId === rowId) return false;
  const except = placement.zone === "board" ? cardId : undefined;
  return rowOccupancy(state.cards, rowId, except) < MAX_ROW_CARDS;
}

export function placeCard(
  placements: Record<string, CardPlacement>,
  cardId: string,
  rowId: string,
  comebackBonus = false,
): Record<string, CardPlacement> {
  const current = placements[cardId];
  if (!current) return placements;
  return {
    ...placements,
    [cardId]: {
      ...current,
      zone: "board",
      rowId,
      rowOrder: nextRowOrder(placements, rowId),
      comebackBonus,
    },
  };
}

export function qualifiesComeback(
  placements: Record<string, CardPlacement>,
  roster: Record<string, TeamCard>,
  cardId: string,
  rowId: string,
): boolean {
  const card = roster[cardId];
  const current = placements[cardId];
  if (!card || !current || cardSymbol(card) !== "cross") return false;

  const without = {
    ...placements,
    [cardId]: { ...current, zone: "hand" as const, rowId: null, rowOrder: 0, comebackBonus: false },
  };
  const key = rowKeyOf(rowId);
  return rowPower(without, roster, current.side, key) < rowPower(without, roster, oppositeSide(current.side), key);
}

export function scoreCard(
  placements: Record<string, CardPlacement>,
  roster: Record<string, TeamCard>,
  cardId: string,
): CardScore {
  const placement = placements[cardId];
  const card = roster[cardId];
  if (!placement || !card || placement.zone !== "board" || !placement.rowId) {
    return { cardId, base: 0, bonus: 0, total: 0, bonuses: [] };
  }

  const def = SYMBOL_DEFS[cardSymbol(card)];
  const rowKey = rowKeyOf(placement.rowId);
  const others = rowCardIds(placements, placement.side, rowKey).filter((id) => id !== cardId);
  const bonuses: CardScore["bonuses"] = [];

  const commanderPeers = others.filter((id) => {
    const peer = roster[id];
    return peer && cardSymbol(peer) === "star";
  }).length;
  if (commanderPeers > 0) bonuses.push({ kind: "commander", amount: commanderPeers });
  if (def.symbol === "triangle" && rowKey === "row-1") bonuses.push({ kind: "vanguard", amount: 3 });
  if (def.symbol === "hexagon" && rowKey === "row-2") bonuses.push({ kind: "core", amount: 2 });
  if (def.symbol === "rhombus" && others.length > 0) bonuses.push({ kind: "swarm", amount: others.length });
  if (def.symbol === "cross" && placement.comebackBonus) bonuses.push({ kind: "comeback", amount: 2 });

  const bonus = bonuses.reduce((sum, item) => sum + item.amount, 0);
  return { cardId, base: def.basePower, bonus, total: def.basePower + bonus, bonuses };
}

export function rowPower(
  placements: Record<string, CardPlacement>,
  roster: Record<string, TeamCard>,
  side: SideId,
  rowKey: RowKey,
): number {
  return rowCardIds(placements, side, rowKey).reduce(
    (sum, cardId) => sum + scoreCard(placements, roster, cardId).total,
    0,
  );
}

export function sidePower(
  placements: Record<string, CardPlacement>,
  roster: Record<string, TeamCard>,
  side: SideId,
): number {
  return ROW_KEYS.reduce((sum, key) => sum + rowPower(placements, roster, side, key), 0);
}

export function evaluateMatch(
  placements: Record<string, CardPlacement>,
  roster: Record<string, TeamCard>,
  playerSide: SideId,
): MatchResult {
  const rows = ROW_KEYS.map((rowKey) => {
    const sideACards = rowCardIds(placements, "sideA", rowKey).map((id) => scoreCard(placements, roster, id));
    const sideBCards = rowCardIds(placements, "sideB", rowKey).map((id) => scoreCard(placements, roster, id));
    const sideA = sideACards.reduce((sum, card) => sum + card.total, 0);
    const sideB = sideBCards.reduce((sum, card) => sum + card.total, 0);
    return {
      rowKey,
      sideA,
      sideB,
      winner: (sideA === sideB ? "draw" : sideA > sideB ? "sideA" : "sideB") as SideId | "draw",
      cards: { sideA: sideACards, sideB: sideBCards },
    };
  });

  const rowsWon = { sideA: 0, sideB: 0 };
  rows.forEach((row) => {
    if (row.winner === "sideA") rowsWon.sideA += 1;
    if (row.winner === "sideB") rowsWon.sideB += 1;
  });

  const totalPower = {
    sideA: sidePower(placements, roster, "sideA"),
    sideB: sidePower(placements, roster, "sideB"),
  };

  const rowWinner = rowsWon.sideA === rowsWon.sideB ? null : rowsWon.sideA > rowsWon.sideB ? "sideA" : "sideB";
  const powerWinner =
    totalPower.sideA === totalPower.sideB ? null : totalPower.sideA > totalPower.sideB ? "sideA" : "sideB";
  const winner = rowWinner ?? powerWinner;

  return {
    outcome: winner ? (winner === playerSide ? "win" : "loss") : "draw",
    rowsWon,
    totalPower,
    rows,
  };
}

export function handPlacements(cards: TeamCard[]): Record<string, CardPlacement> {
  const order = { sideA: 0, sideB: 0 };
  return cards.reduce<Record<string, CardPlacement>>((acc, card) => {
    acc[card.id] = {
      zone: "hand",
      side: card.side,
      handOrder: order[card.side]++,
      rowId: null,
      rowOrder: 0,
      allowedRows: allowedRowsFor(card),
    };
    return acc;
  }, {});
}
