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

  it("commits a played card immediately so the next card can be played after the bot", () => {
    let state = createMatchState(TEAM_BOARD_CARDS, "sideA", "sideA", "m1");
    state = gameReducer(state, { type: "PLAY_CARD", cardId: "max-kiselev", rowId: "sideA-row-1" }, TEAM_BOARD_CARDS);
    assert.equal(state.phase, "botTurn");
    assert.equal(state.pendingCardId, null);
    assert.equal(state.cards["max-kiselev"].zone, "board");
    assert.deepEqual(state.moves, [{ cardId: "max-kiselev", rowId: "sideA-row-1" }]);

    const botCard = Object.entries(state.cards).find(([, card]) => card.side === "sideB" && card.zone === "hand");
    assert.ok(botCard);
    state = gameReducer(state, { type: "BOT_PLAY", cardId: botCard[0], rowId: botCard[1].allowedRows[0] }, TEAM_BOARD_CARDS);
    assert.equal(state.phase, "playerTurn");
    assert.equal(state.turn, 2);

    state = gameReducer(state, { type: "PLAY_CARD", cardId: "tatyana-gribanova", rowId: "sideA-row-2" }, TEAM_BOARD_CARDS);
    assert.equal(state.cards["tatyana-gribanova"].zone, "board");
    assert.equal(state.phase, "botTurn");
    assert.equal(state.pendingCardId, null);
  });

  it("cannot return a card after the play is committed", () => {
    let state = createMatchState(TEAM_BOARD_CARDS, "sideA", "sideA", "m1");
    state = gameReducer(state, { type: "PLAY_CARD", cardId: "ivan-bobrovsky", rowId: "sideA-row-2" }, TEAM_BOARD_CARDS);
    state = gameReducer(state, { type: "RETURN_CARD", cardId: "ivan-bobrovsky" }, TEAM_BOARD_CARDS);
    assert.equal(state.cards["ivan-bobrovsky"].zone, "board");
    assert.equal(state.phase, "botTurn");
  });

  it("does not allow a second card on the same player turn", () => {
    let state = createMatchState(TEAM_BOARD_CARDS, "sideA", "sideA", "m1");
    state = gameReducer(state, { type: "PLAY_CARD", cardId: "max-kiselev", rowId: "sideA-row-1" }, TEAM_BOARD_CARDS);
    state = gameReducer(state, { type: "PLAY_CARD", cardId: "tatyana-gribanova", rowId: "sideA-row-2" }, TEAM_BOARD_CARDS);
    assert.equal(state.cards["tatyana-gribanova"].zone, "hand");
    assert.equal(state.cards["max-kiselev"].zone, "board");
    assert.equal(state.moves.length, 1);
  });
});
