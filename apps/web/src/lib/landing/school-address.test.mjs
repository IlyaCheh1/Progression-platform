import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import { fileURLToPath } from "node:url";

import {
  SCHOOL_ADDRESS,
  SCHOOL_ADDRESS_ROUTE,
  SCHOOL_ENTRANCE,
  SCHOOL_ENTRANCE_LABEL,
  schoolAddressMapSrc,
} from "./school-address.ts";

describe("school address map", () => {
  it("uses the given address and a keyless Yandex widget with one point", () => {
    assert.equal(SCHOOL_ADDRESS, "Москва, Госпитальный вал 5к18");
    assert.equal(
      SCHOOL_ADDRESS_ROUTE,
      "10 минут от станции метро Электрозаводская, рядом со стадионом Металлург МГТУ им. Баумана",
    );
    assert.equal(SCHOOL_ENTRANCE_LABEL, "Вход в школу:");
    assert.equal(SCHOOL_ENTRANCE, "справа от 5-го подъезда, со двора дома");
    const src = schoolAddressMapSrc();
    assert.match(src, /^https:\/\/yandex\.ru\/map-widget\/v1\/\?/);
    assert.match(src, /ll=37\.704987,55\.774781/);
    assert.match(src, /pt=37\.704987,55\.774781,pm2rdm/);
    assert.match(src, /theme=dark/);
    assert.doesNotMatch(src, /55\.774153|37\.710692|5к1/);
    assert.equal(src.split("pt=").length - 1, 1);
    assert.doesNotMatch(src, /apikey|api_key|apiKey/i);

    const landing = readFileSync(fileURLToPath(new URL("../../screens/landing/address.tsx", import.meta.url)), "utf8");
    const index = readFileSync(fileURLToPath(new URL("../../screens/landing/index.tsx", import.meta.url)), "utf8");
    assert.match(landing, /Адрес школы/);
    assert.match(landing, /school-address-layout/);
    assert.match(landing, /SCHOOL_ADDRESS_ROUTE/);
    assert.match(landing, /SCHOOL_ENTRANCE/);
    assert.match(landing, /schoolAddressMapSrc/);
    const css = readFileSync(fileURLToPath(new URL("../../screens/landing/styles.css", import.meta.url)), "utf8");
    assert.match(css, /\.school-address-layout \{[^}]*grid-template-columns:\s*minmax\(0,\s*1\.15fr\)/);
    assert.match(css, /@media \(max-width: 767px\) \{[\s\S]*\.school-address-layout \{[^}]*grid-template-columns:\s*1fr/);
    assert.doesNotMatch(landing, /Открыть в Яндекс Картах|schoolAddressMapsHref|<a[\s>]/);
    assert.match(index, /<Address \/>/);
  });
});
