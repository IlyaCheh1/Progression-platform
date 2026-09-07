import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { createMatchState, createSetupState, gameReducer } from "./game-reducer.ts";
import { TEAM_BOARD_CARDS } from "./roster.ts";

describe("gameReducer", () => {
  it("starts a match from chosen side", () => {
    const started = gameReducer(
      createSetupState(),
      { type: "CHOOSE_SIDE", side: "sideA", firstSide: "sideA", matchId: "m1" },
      TEAM_BOARD_CARDS,
    );
    assert.equal(started.phase, "playerTurn");
    assert.equal(started.playerSide, "sideA");
    assert.equal(started.turn, 1);
    assert.equal(Object.keys(started.cards).length, 12);
  });

  it("plays one pending card, confirms, then finishes after six turns", () => {
    let state = createMatchState(TEAM_BOARD_CARDS, "sideA", "sideA", "m1");
    state = gameReducer(state, { type: "PLAY_CARD", cardId: "max-kiselev", rowId: "sideA-row-1" }, TEAM_BOARD_CARDS);
    assert.equal(state.pendingCardId, "max-kiselev");
    assert.equal(state.cards["max-kiselev"].zone, "board");

    state = gameReducer(state, { type: "CONFIRM_TURN" }, TEAM_BOARD_CARDS);
    assert.equal(state.phase, "botTurn");
    assert.equal(state.pendingCardId, null);
    assert.equal(state.turn, 1);

    const botCard = Object.entries(state.cards).find(([, card]) => card.side === "sideB" && card.zone === "hand");
    assert.ok(botCard);
    state = gameReducer(state, { type: "BOT_PLAY", cardId: botCard[0], rowId: botCard[1].allowedRows[0] }, TEAM_BOARD_CARDS);
    assert.equal(state.phase, "playerTurn");
    assert.equal(state.turn, 2);
  });

  it("returns a pending card to hand", () => {
    let state = createMatchState(TEAM_BOARD_CARDS, "sideA", "sideA", "m1");
    state = gameReducer(state, { type: "PLAY_CARD", cardId: "ivan-bobrovsky", rowId: "sideA-row-2" }, TEAM_BOARD_CARDS);
    state = gameReducer(state, { type: "RETURN_CARD", cardId: "ivan-bobrovsky" }, TEAM_BOARD_CARDS);
    assert.equal(state.pendingCardId, null);
    assert.equal(state.cards["ivan-bobrovsky"].zone, "hand");
  });

  it("does not allow a second play before confirm", () => {
    let state = createMatchState(TEAM_BOARD_CARDS, "sideA", "sideA", "m1");
    state = gameReducer(state, { type: "PLAY_CARD", cardId: "max-kiselev", rowId: "sideA-row-1" }, TEAM_BOARD_CARDS);
    state = gameReducer(state, { type: "PLAY_CARD", cardId: "tatyana-gribanova", rowId: "sideA-row-2" }, TEAM_BOARD_CARDS);
    assert.equal(state.cards["tatyana-gribanova"].zone, "hand");
    assert.equal(state.pendingCardId, "max-kiselev");
  });
});
