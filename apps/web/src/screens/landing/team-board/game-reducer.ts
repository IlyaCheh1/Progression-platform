import {
  canPlaceOnRow,
  cardsById,
  evaluateMatch,
  handPlacements,
  MATCH_TURNS,
  oppositeSide,
  placeCard,
  qualifiesComeback,
} from "./scoring.ts";
import type { GameAction, GameState, SideId, TeamCard } from "./types.ts";

export function createSetupState(activeSide: SideId = "sideA"): GameState {
  return {
    phase: "setup",
    matchId: null,
    moves: [],
    playerSide: null,
    firstSide: null,
    turn: 1,
    selectedCardId: null,
    expandedCardId: null,
    activeSide,
    cards: {},
    dragging: null,
    pendingCardId: null,
    result: null,
  };
}

export function createMatchState(
  cards: TeamCard[],
  playerSide: SideId,
  firstSide: SideId = playerSide,
  matchId: string | null = null,
): GameState {
  return {
    phase: firstSide === playerSide ? "playerTurn" : "botTurn",
    matchId,
    moves: [],
    playerSide,
    firstSide,
    turn: 1,
    selectedCardId: null,
    expandedCardId: null,
    activeSide: firstSide,
    cards: handPlacements(cards),
    dragging: null,
    pendingCardId: null,
    result: null,
  };
}

function advanceTurn(state: GameState, actorSide: SideId, nextPhase: GameState["phase"]) {
  if (actorSide === state.firstSide) {
    return { phase: nextPhase, turn: state.turn };
  }
  const finished = state.turn >= MATCH_TURNS;
  return {
    phase: finished ? ("finished" as const) : nextPhase,
    turn: finished ? state.turn : state.turn + 1,
  };
}

export function canSelectPlayerCard(state: GameState, cardId: string): boolean {
  if (state.phase !== "playerTurn" || !state.playerSide) return false;
  const card = state.cards[cardId];
  if (!card || card.side !== state.playerSide) return false;
  return card.zone === "hand" ? state.pendingCardId === null : state.pendingCardId === cardId;
}

export function gameReducer(state: GameState, action: GameAction, roster: TeamCard[] = []): GameState {
  const catalog = cardsById(roster);

  switch (action.type) {
    case "CHOOSE_SIDE":
      if (state.phase !== "setup" || roster.length === 0) return state;
      return createMatchState(roster, action.side, action.firstSide, action.matchId);
    case "OPEN_CARD":
      if (!state.cards[action.cardId]) return state;
      return { ...state, selectedCardId: action.cardId, expandedCardId: action.cardId, dragging: null };
    case "CLOSE_CARD":
      if (state.expandedCardId === null) return state;
      return { ...state, expandedCardId: null };
    case "PLAY_CARD": {
      if (state.phase !== "playerTurn" || !state.playerSide || state.pendingCardId !== null) return state;
      const card = state.cards[action.cardId];
      if (!card || card.zone !== "hand" || card.side !== state.playerSide || !canPlaceOnRow(state, action.cardId, action.rowId)) {
        return state;
      }
      return {
        ...state,
        selectedCardId: action.cardId,
        expandedCardId: null,
        dragging: null,
        pendingCardId: action.cardId,
        cards: placeCard(state.cards, action.cardId, action.rowId, qualifiesComeback(state.cards, catalog, action.cardId, action.rowId)),
      };
    }
    case "MOVE_CARD": {
      if (state.phase !== "playerTurn" || !state.playerSide || state.pendingCardId !== action.cardId) return state;
      const card = state.cards[action.cardId];
      if (!card || card.zone !== "board" || card.side !== state.playerSide || !canPlaceOnRow(state, action.cardId, action.rowId)) {
        return state;
      }
      return {
        ...state,
        selectedCardId: action.cardId,
        expandedCardId: null,
        dragging: null,
        cards: placeCard(state.cards, action.cardId, action.rowId, qualifiesComeback(state.cards, catalog, action.cardId, action.rowId)),
      };
    }
    case "RETURN_CARD": {
      if (state.phase !== "playerTurn") return state;
      const card = state.cards[action.cardId];
      if (!card || card.zone !== "board" || state.pendingCardId !== action.cardId) return state;
      return {
        ...state,
        selectedCardId: action.cardId,
        expandedCardId: null,
        dragging: null,
        pendingCardId: null,
        cards: {
          ...state.cards,
          [action.cardId]: { ...card, zone: "hand", rowId: null, rowOrder: 0, comebackBonus: false },
        },
      };
    }
    case "CONFIRM_TURN": {
      if (state.phase !== "playerTurn" || !state.playerSide || state.pendingCardId === null) return state;
      const rowId = state.cards[state.pendingCardId]?.rowId;
      if (!rowId) return state;
      return {
        ...state,
        ...advanceTurn(state, state.playerSide, "botTurn"),
        moves: [...state.moves, { cardId: state.pendingCardId, rowId }],
        activeSide: oppositeSide(state.playerSide),
        pendingCardId: null,
        expandedCardId: null,
        dragging: null,
        selectedCardId: null,
      };
    }
    case "BOT_PLAY": {
      if (state.phase !== "botTurn" || !state.playerSide) return state;
      const card = state.cards[action.cardId];
      if (!card || card.zone !== "hand" || card.side === state.playerSide || !canPlaceOnRow(state, action.cardId, action.rowId)) {
        return state;
      }
      return {
        ...state,
        ...advanceTurn(state, card.side, "playerTurn"),
        moves: [...state.moves, { cardId: action.cardId, rowId: action.rowId }],
        cards: placeCard(state.cards, action.cardId, action.rowId, qualifiesComeback(state.cards, catalog, action.cardId, action.rowId)),
        selectedCardId: action.cardId,
        dragging: null,
        pendingCardId: null,
        result: null,
      };
    }
    case "FINISH_MATCH":
      if (!state.playerSide || state.phase === "setup") return state;
      return {
        ...state,
        phase: "finished",
        result: action.result ?? evaluateMatch(state.cards, catalog, state.playerSide),
        pendingCardId: null,
        dragging: null,
        expandedCardId: null,
      };
    case "START_DRAG": {
      if (state.phase !== "playerTurn" || !state.playerSide) return state;
      const card = state.cards[action.cardId];
      if (
        !card ||
        card.side !== state.playerSide ||
        (card.zone === "hand" && state.pendingCardId !== null) ||
        (card.zone === "board" && state.pendingCardId !== action.cardId)
      ) {
        return state;
      }
      return { ...state, selectedCardId: action.cardId, dragging: { cardId: action.cardId, sourceRowId: card.rowId } };
    }
    case "END_DRAG":
      if (state.dragging === null) return state;
      return { ...state, dragging: null };
    case "SET_ACTIVE_SIDE":
      if (state.activeSide === action.side) return state;
      return { ...state, activeSide: action.side, expandedCardId: null };
    case "REMATCH":
      if (!state.playerSide || roster.length === 0) return state;
      return createMatchState(roster, state.playerSide, action.firstSide, action.matchId);
    case "BACK_TO_SETUP":
      return createSetupState(state.activeSide);
    default:
      return state;
  }
}
