import { handPlacements, nextRowOrder } from "./scoring.ts";
import type { ExploreAction, ExploreState, SideId, TeamCard } from "./types.ts";

export function createExploreState(cards: TeamCard[], activeSide: SideId = "sideA"): ExploreState {
  return {
    selectedCardId: null,
    expandedCardId: null,
    activeSide,
    cards: handPlacements(cards),
    dragging: null,
  };
}

function withPlacement(
  state: ExploreState,
  cardId: string,
  patch: ExploreState["cards"][string],
): ExploreState {
  return {
    ...state,
    selectedCardId: cardId,
    expandedCardId: null,
    dragging: null,
    cards: { ...state.cards, [cardId]: patch },
  };
}

export function exploreReducer(state: ExploreState, action: ExploreAction): ExploreState {
  switch (action.type) {
    case "OPEN_CARD":
      if (!state.cards[action.cardId]) return state;
      return { ...state, selectedCardId: action.cardId, expandedCardId: action.cardId, dragging: null };
    case "CLOSE_CARD":
      if (state.expandedCardId === null) return state;
      return { ...state, expandedCardId: null };
    case "PLAY_CARD": {
      const card = state.cards[action.cardId];
      if (!card || card.zone !== "hand" || !card.allowedRows.includes(action.rowId)) return state;
      return withPlacement(state, action.cardId, {
        ...card,
        zone: "board",
        rowId: action.rowId,
        rowOrder: nextRowOrder(state.cards, action.rowId),
      });
    }
    case "MOVE_CARD": {
      const card = state.cards[action.cardId];
      if (!card || card.zone !== "board" || !card.allowedRows.includes(action.rowId) || card.rowId === action.rowId) {
        return state;
      }
      return withPlacement(state, action.cardId, {
        ...card,
        rowId: action.rowId,
        rowOrder: nextRowOrder(state.cards, action.rowId),
      });
    }
    case "RETURN_CARD": {
      const card = state.cards[action.cardId];
      if (!card || card.zone !== "board") return state;
      return withPlacement(state, action.cardId, {
        ...card,
        zone: "hand",
        rowId: null,
        rowOrder: 0,
      });
    }
    case "START_DRAG": {
      const card = state.cards[action.cardId];
      if (!card) return state;
      return { ...state, selectedCardId: action.cardId, dragging: { cardId: action.cardId, sourceRowId: card.rowId } };
    }
    case "END_DRAG":
      if (state.dragging === null) return state;
      return { ...state, dragging: null };
    case "SET_ACTIVE_SIDE":
      if (state.activeSide === action.side) return state;
      return { ...state, activeSide: action.side, expandedCardId: null };
    case "RESET_BOARD": {
      const cards = Object.entries(state.cards).reduce<ExploreState["cards"]>((acc, [id, card]) => {
        acc[id] =
          card.zone === "hand"
            ? card
            : { ...card, zone: "hand", rowId: null, rowOrder: 0 };
        return acc;
      }, {});
      return { ...state, selectedCardId: null, expandedCardId: null, dragging: null, cards };
    }
    default:
      return state;
  }
}
