import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { audienceFromSearch, isAudienceMode, parseAudience, publicNavForAudience, withAudience } from "./audience.ts";

describe("audience mode", () => {
  it("parses kids aliases and rejects junk", () => {
    assert.equal(parseAudience("kids"), "kids");
    assert.equal(parseAudience("deti"), "kids");
    assert.equal(parseAudience("adults"), "adults");
    assert.equal(parseAudience("??"), null);
    assert.equal(isAudienceMode("kids"), true);
    assert.equal(isAudienceMode("teen"), false);
  });

  it("keeps adults URLs clean and adds kids query", () => {
    assert.equal(withAudience("/tariffs", "adults"), "/tariffs");
    assert.equal(withAudience("/tariffs", "kids"), "/tariffs?audience=kids");
    assert.equal(withAudience("/#directions", "kids"), "/?audience=kids#directions");
    assert.equal(withAudience("/akcii?ref=nav", "kids"), "/akcii?ref=nav&audience=kids");
  });

  it("hides the rooms slider link in kids public nav", () => {
    const items = [
      { title: "О нас", href: "/about" },
      { title: "Направления", href: "/#directions" },
      { title: "Тарифы", href: "/tariffs" },
    ];
    assert.deepEqual(
      publicNavForAudience(items, "adults").map((item) => item.href),
      ["/about", "/#directions", "/tariffs"],
    );
    assert.deepEqual(
      publicNavForAudience(items, "kids").map((item) => item.href),
      ["/about", "/tariffs"],
    );
  });

  it("reads the first audience query value for the homepage", () => {
    assert.equal(audienceFromSearch("kids"), "kids");
    assert.equal(audienceFromSearch(["kids", "adults"]), "kids");
    assert.equal(audienceFromSearch(undefined), "adults");
  });
});
