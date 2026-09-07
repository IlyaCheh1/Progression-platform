import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { createExploreState, exploreReducer } from "./explore-reducer.ts";

const cards = [
  {
    id: "max-kiselev",
    side: "sideA",
    name: "Макс",
    role: "тренер",
    shortDescription: "",
    fullDescription: "",
    initials: "МК",
    image: { src: "/media/trainers/max-kiselev.webp", alt: "Макс" },
    visual: { accent: "#d4a84b", symbol: "star" },
  },
  {
    id: "mock-sparring-1",
    side: "sideB",
    name: "Спарринг I",
    role: "Место в составе",
    shortDescription: "",
    fullDescription: "",
    mock: true,
    initials: "С1",
    image: { alt: "Спарринг I" },
    visual: { accent: "#7a6a4a", symbol: "star" },
  },
];

describe("exploreReducer", () => {
  it("plays, moves, returns and resets a card", () => {
    let state = createExploreState(cards);
    assert.equal(state.cards["max-kiselev"].zone, "hand");

    state = exploreReducer(state, { type: "PLAY_CARD", cardId: "max-kiselev", rowId: "sideA-row-1" });
    assert.equal(state.cards["max-kiselev"].zone, "board");
    assert.equal(state.cards["max-kiselev"].rowId, "sideA-row-1");

    state = exploreReducer(state, { type: "MOVE_CARD", cardId: "max-kiselev", rowId: "sideA-row-2" });
    assert.equal(state.cards["max-kiselev"].rowId, "sideA-row-2");

    state = exploreReducer(state, { type: "RETURN_CARD", cardId: "max-kiselev" });
    assert.equal(state.cards["max-kiselev"].zone, "hand");
    assert.equal(state.cards["max-kiselev"].rowId, null);

    state = exploreReducer(state, { type: "PLAY_CARD", cardId: "max-kiselev", rowId: "sideA-row-3" });
    state = exploreReducer(state, { type: "RESET_BOARD" });
    assert.equal(state.cards["max-kiselev"].zone, "hand");
    assert.equal(state.selectedCardId, null);
  });

  it("rejects a play onto a forbidden row", () => {
    const rhombus = {
      ...cards[0],
      id: "ivan-bobrovsky",
      visual: { accent: "#5c7d99", symbol: "rhombus" },
    };
    let state = createExploreState([rhombus]);
    state = exploreReducer(state, { type: "PLAY_CARD", cardId: "ivan-bobrovsky", rowId: "sideA-row-1" });
    assert.equal(state.cards["ivan-bobrovsky"].zone, "hand");
  });
});
