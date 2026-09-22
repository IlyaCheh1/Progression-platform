import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import { fileURLToPath } from "node:url";

import {
  audienceFromPathname,
  audienceFromSearch,
  homeForAudience,
  isAudienceMode,
  isLandingPath,
  parseAudience,
  publicNavForAudience,
  withAudience,
} from "./audience.ts";

describe("audience mode", () => {
  it("parses kids aliases and rejects junk", () => {
    assert.equal(parseAudience("kids"), "kids");
    assert.equal(parseAudience("deti"), "kids");
    assert.equal(parseAudience("adults"), "adults");
    assert.equal(parseAudience("??"), null);
    assert.equal(isAudienceMode("kids"), true);
    assert.equal(isAudienceMode("teen"), false);
  });

  it("maps kids home to /kids and keeps other URLs clean", () => {
    assert.equal(homeForAudience("kids"), "/kids");
    assert.equal(homeForAudience("adults"), "/");
    assert.equal(audienceFromPathname("/kids"), "kids");
    assert.equal(audienceFromPathname("/"), "adults");
    assert.equal(isLandingPath("/kids"), true);
    assert.equal(withAudience("/#tariffs", "adults"), "/#tariffs");
    assert.equal(withAudience("/#tariffs", "kids"), "/kids#tariffs");
    assert.equal(withAudience("/#answers", "adults"), "/#answers");
    assert.equal(withAudience("/#answers", "kids"), "/kids#answers");
    assert.equal(withAudience("/#directions", "kids"), "/kids#directions");
    assert.equal(withAudience("/#join", "kids"), "/kids#join");
    assert.equal(withAudience("/akcii?ref=nav", "kids"), "/akcii?ref=nav");
    assert.equal(withAudience("/kids#join", "adults"), "/#join");
  });

  it("hides directions and hall rental from the kids menu and keeps section hashes on /kids", () => {
    const items = [
      { title: "О нас", href: "/about" },
      { title: "Направления", href: "/#directions" },
      { title: "Тарифы", href: "/#tariffs" },
      { title: "Аренда зала", href: "/#arenda" },
      { title: "FAQ", href: "/#answers" },
    ];
    assert.deepEqual(
      publicNavForAudience(items, "adults").map((item) => item.href),
      ["/about", "/#directions", "/#tariffs", "/#arenda", "/#answers"],
    );
    assert.deepEqual(
      publicNavForAudience(items, "kids").map((item) => item.href),
      ["/about", "/#tariffs", "/#answers"],
    );
    const header = readFileSync(fileURLToPath(new URL("../components/header-public.tsx", import.meta.url)), "utf8");
    assert.match(header, /title: "Тарифы", href: "\/#tariffs"/);
    assert.match(header, /title: "FAQ", href: "\/#answers"/);
    assert.match(header, /title: "Аренда зала", href: "\/#arenda"/);
    assert.doesNotMatch(header, /href: "\/tariffs"|href: "\/faq"/);
  });

  it("reads the first audience query value for the homepage redirect", () => {
    assert.equal(audienceFromSearch("kids"), "kids");
    assert.equal(audienceFromSearch(["kids", "adults"]), "kids");
    assert.equal(audienceFromSearch(undefined), "adults");
  });
});
