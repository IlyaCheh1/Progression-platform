import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { evaluateMatch, placeCard, qualifiesComeback, scoreCard } from "./scoring.ts";
import { TEAM_BOARD_CARDS } from "./roster.ts";
import { cardsById } from "./scoring.ts";

function card(id, side, symbol, extra = {}) {
  return {
    id,
    side,
    name: id,
    role: "test",
    shortDescription: "",
    fullDescription: "",
    initials: "T",
    image: { alt: id },
    visual: { accent: "#d4a84b", symbol },
    ...extra,
  };
}

function hand(cards) {
  const order = { sideA: 0, sideB: 0 };
  return cards.reduce((acc, item) => {
    acc[item.id] = {
      zone: "hand",
      side: item.side,
      handOrder: order[item.side]++,
      rowId: null,
      rowOrder: 0,
      allowedRows: {
        star: [`${item.side}-row-1`, `${item.side}-row-2`, `${item.side}-row-3`],
        triangle: [`${item.side}-row-1`, `${item.side}-row-2`],
        hexagon: [`${item.side}-row-1`, `${item.side}-row-2`],
        rhombus: [`${item.side}-row-2`, `${item.side}-row-3`],
        cross: [`${item.side}-row-1`, `${item.side}-row-3`],
      }[item.visual.symbol],
    };
    return acc;
  }, {});
}

describe("team-board scoring", () => {
  it("gives commander +1 per other star in the same row", () => {
    const cards = [card("a1", "sideA", "star"), card("a2", "sideA", "star")];
    const roster = cardsById(cards);
    let placements = hand(cards);
    placements = placeCard(placements, "a1", "sideA-row-1");
    placements = placeCard(placements, "a2", "sideA-row-1");
    const score = scoreCard(placements, roster, "a1");
    assert.equal(score.base, 5);
    assert.equal(score.bonus, 1);
    assert.equal(score.total, 6);
    assert.deepEqual(score.bonuses, [{ kind: "commander", amount: 1 }]);
  });

  it("gives vanguard +3 to triangle on row-1 only", () => {
    const cards = [card("t", "sideA", "triangle")];
    const roster = cardsById(cards);
    const onFront = placeCard(hand(cards), "t", "sideA-row-1");
    const onMid = placeCard(hand(cards), "t", "sideA-row-2");
    assert.equal(scoreCard(onFront, roster, "t").bonus, 3);
    assert.equal(scoreCard(onMid, roster, "t").bonus, 0);
  });

  it("gives core +2 to hexagon on row-2", () => {
    const cards = [card("h", "sideA", "hexagon")];
    const roster = cardsById(cards);
    const mid = placeCard(hand(cards), "h", "sideA-row-2");
    assert.equal(scoreCard(mid, roster, "h").bonus, 2);
  });

  it("gives swarm +1 per other card in the rhombus row", () => {
    const cards = [card("r", "sideA", "rhombus"), card("s", "sideA", "hexagon")];
    const roster = cardsById(cards);
    let placements = hand(cards);
    placements = placeCard(placements, "r", "sideA-row-2");
    placements = placeCard(placements, "s", "sideA-row-2");
    assert.equal(scoreCard(placements, roster, "r").bonus, 1);
  });

  it("gives comeback +2 when a cross is placed into a weaker row", () => {
    const cards = [card("c", "sideA", "cross"), card("b", "sideB", "triangle")];
    const roster = cardsById(cards);
    let placements = hand(cards);
    placements = placeCard(placements, "b", "sideB-row-1");
    assert.equal(qualifiesComeback(placements, roster, "c", "sideA-row-1"), true);
    placements = placeCard(placements, "c", "sideA-row-1", true);
    assert.equal(scoreCard(placements, roster, "c").bonus, 2);
  });

  it("resolves match by rows first, then total power", () => {
    const cards = [card("a", "sideA", "triangle"), card("b", "sideB", "rhombus")];
    const roster = cardsById(cards);
    let placements = hand(cards);
    placements = placeCard(placements, "a", "sideA-row-1");
    placements = placeCard(placements, "b", "sideB-row-2");
    const result = evaluateMatch(placements, roster, "sideA");
    assert.equal(result.rowsWon.sideA, 1);
    assert.equal(result.rowsWon.sideB, 1);
    assert.equal(result.outcome, "win");
  });
});

describe("MasterSword roster", () => {
  it("is 6 vs 6 with live trainers and marked mocks", () => {
    const sideA = TEAM_BOARD_CARDS.filter((item) => item.side === "sideA");
    const sideB = TEAM_BOARD_CARDS.filter((item) => item.side === "sideB");
    assert.equal(sideA.length, 6);
    assert.equal(sideB.length, 6);
    const realIds = ["max-kiselev", "nikolay-lobanov", "tatyana-gribanova", "ivan-bobrovsky"];
    for (const id of realIds) {
      const found = TEAM_BOARD_CARDS.find((item) => item.id === id);
      assert.ok(found);
      assert.equal(found.mock, false);
      assert.ok(found.image.src);
    }
    const mocks = TEAM_BOARD_CARDS.filter((item) => item.mock);
    assert.equal(mocks.length, 8);
    for (const mock of mocks) {
      assert.ok(mock.id.startsWith("mock-"));
      assert.equal(mock.image.src, undefined);
      assert.match(mock.fullDescription, /не сотрудник/i);
    }
  });
});
