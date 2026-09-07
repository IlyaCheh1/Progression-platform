import { canPlaceOnRow, evaluateMatch, oppositeSide, placeCard, qualifiesComeback, rowKeyOf, rowPower, sidePower } from "./scoring.ts";
import { ROW_KEYS, type CardPlacement, type GameState, type RowKey, type SideId, type TeamCard } from "./types.ts";

export type BotMove = {
  cardId: string;
  rowId: string;
  nextCards: Record<string, CardPlacement>;
  score?: number;
};

type Weights = { rowWeights: Record<RowKey, number> };

function legalMoves(
  placements: Record<string, CardPlacement>,
  roster: Record<string, TeamCard>,
  side: SideId,
): BotMove[] {
  const state = { cards: placements };
  const handIds = Object.entries(placements)
    .filter(([, card]) => card.zone === "hand" && card.side === side)
    .sort(([, a], [, b]) => a.handOrder - b.handOrder)
    .map(([id]) => id);

  const moves: BotMove[] = [];
  for (const cardId of handIds) {
    const card = placements[cardId];
    if (!card) continue;
    for (const rowId of card.allowedRows) {
      if (!canPlaceOnRow(state, cardId, rowId)) continue;
      moves.push({
        cardId,
        rowId,
        nextCards: placeCard(placements, cardId, rowId, qualifiesComeback(placements, roster, cardId, rowId)),
      });
    }
  }
  return moves;
}

function heuristic(placements: Record<string, CardPlacement>, roster: Record<string, TeamCard>, side: SideId, weights: Weights): number {
  const foe = oppositeSide(side);
  return (
    ROW_KEYS.reduce((sum, key) => {
      const ours = rowPower(placements, roster, side, key);
      const theirs = rowPower(placements, roster, foe, key);
      const clamped = Math.max(-4, Math.min(ours - theirs, 4));
      const weight = weights.rowWeights[key];
      if (ours > theirs) return sum + (40 + 2 * clamped) * weight;
      if (ours < theirs) return sum + 2 * clamped * weight;
      return sum + (ours > 0 ? 12 * weight : 0);
    }, 0) + sidePower(placements, roster, side)
  );
}

function minimax(
  placements: Record<string, CardPlacement>,
  roster: Record<string, TeamCard>,
  botSide: SideId,
  actor: SideId,
  depth: number,
  weights: Weights,
  alpha: number,
  beta: number,
): number {
  if (depth === 0) return heuristic(placements, roster, botSide, weights);

  const moves = legalMoves(placements, roster, actor);
  if (moves.length === 0) {
    const result = evaluateMatch(placements, roster, oppositeSide(botSide));
    const terminal = result.outcome === "loss" ? 10_000 : result.outcome === "win" ? -10_000 : 0;
    return terminal + heuristic(placements, roster, botSide, weights);
  }

  if (actor === botSide) {
    let best = -Infinity;
    for (const move of moves) {
      best = Math.max(best, minimax(move.nextCards, roster, botSide, oppositeSide(actor), depth - 1, weights, alpha, beta));
      alpha = Math.max(alpha, best);
      if (beta <= alpha) break;
    }
    return best;
  }

  let worst = Infinity;
  for (const move of moves) {
    worst = Math.min(worst, minimax(move.nextCards, roster, botSide, oppositeSide(actor), depth - 1, weights, alpha, beta));
    beta = Math.min(beta, worst);
    if (beta <= alpha) break;
  }
  return worst;
}

export function playerRowWeights(state: GameState, roster: Record<string, TeamCard>): Weights {
  const rowWeights: Record<RowKey, number> = { "row-1": 1, "row-2": 1, "row-3": 1 };
  const playerMoves = state.moves.filter((move) => roster[move.cardId]?.side === state.playerSide);
  playerMoves.forEach((move, index) => {
    const recency = (index + 1) / playerMoves.length;
    rowWeights[rowKeyOf(move.rowId)] += 0.15 + 0.2 * recency;
  });
  return { rowWeights };
}

export function pickBotMove(
  state: GameState,
  roster: Record<string, TeamCard>,
  options: { random?: () => number; depth?: number } = {},
): BotMove | null {
  const botSide = state.playerSide ? oppositeSide(state.playerSide) : null;
  if (!botSide) return null;

  const weights = playerRowWeights(state, roster);
  const depth = options.depth ?? 3;
  const scored = legalMoves(state.cards, roster, botSide).map((move) => ({
    ...move,
    score: minimax(move.nextCards, roster, botSide, oppositeSide(botSide), depth, weights, -Infinity, Infinity),
  }));

  if (scored.length === 0) return null;
  scored.sort((a, b) => {
    if (a.score !== b.score) return (b.score ?? 0) - (a.score ?? 0);
    if (a.cardId !== b.cardId) return a.cardId.localeCompare(b.cardId);
    return a.rowId.localeCompare(b.rowId);
  });

  const top = scored.filter((move) => move.score === scored[0].score);
  if (options.random && top.length !== 1) {
    return top[Math.floor(options.random() * top.length)] ?? top[0];
  }
  return top[0];
}

export function randomSide(random: () => number = Math.random): SideId {
  return random() < 0.5 ? "sideA" : "sideB";
}
