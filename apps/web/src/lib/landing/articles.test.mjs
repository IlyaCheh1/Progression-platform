import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { articlesForAudience, getJournalArticle, JOURNAL_ARTICLES } from "./articles.ts";

describe("journal articles", () => {
  it("seeds several marked mock articles", () => {
    assert.ok(JOURNAL_ARTICLES.length >= 3);
    for (const article of JOURNAL_ARTICLES) {
      assert.equal(article.mock, true);
      assert.ok(getJournalArticle(article.slug));
      if (article.slug === "detskoe-ushu-s-6-let") {
        assert.match(article.teaser, /характер, волю и уверенность/);
        continue;
      }
      assert.match(article.teaser, /заглушка/i);
    }
  });

  it("keeps kids listing on children's wushu only", () => {
    const kids = articlesForAudience(true);
    assert.equal(kids.length, 1);
    assert.equal(kids[0].slug, "detskoe-ushu-s-6-let");
    assert.equal(articlesForAudience(false).length, JOURNAL_ARTICLES.length);
  });
});
