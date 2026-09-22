import assert from "node:assert/strict";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { describe, it } from "node:test";
import { fileURLToPath } from "node:url";

import {
  HALL_RENTAL_ADMIN_ROLES,
  HALL_RENTAL_FACTS,
  HALL_RENTAL_HALLS,
  HALL_RENTAL_PHOTOS,
  normalizePhone,
  parseBearerToken,
  stepHallPhoto,
  validateHallRentalInput,
} from "./hall-rental.ts";

const valid = {
  days: ["mon", "wed"],
  startTime: "18:30",
  hours: 2,
  cadence: "recurring",
  name: "Иван Петров",
  phone: "89151234567",
  email: "ivan@example.com",
  comment: "Нужны зеркала",
};

describe("hall rental canon", () => {
  it("keeps owner facts and photorealistic hall photo paths", () => {
    assert.equal(HALL_RENTAL_FACTS.price, "3 000 ₽ / час");
    assert.equal(HALL_RENTAL_FACTS.area, "80 м²");
    assert.equal(HALL_RENTAL_FACTS.mirrors, "Зеркала");
    assert.equal(HALL_RENTAL_FACTS.floor, "ласточкин хвост");
    assert.equal(HALL_RENTAL_PHOTOS.length, 4);
    assert.ok(HALL_RENTAL_PHOTOS.every((photo) => photo.src.startsWith("/media/arenda/") && photo.src.endsWith(".webp")));
    assert.ok(HALL_RENTAL_PHOTOS.every((photo) => !photo.src.endsWith(".svg")));
    assert.deepEqual(
      HALL_RENTAL_PHOTOS.map((photo) => photo.src),
      [
        "/media/arenda/hall-overview.webp",
        "/media/arenda/hall-mirrors.webp",
        "/media/arenda/hall-windows.webp",
        "/media/arenda/hall-corner.webp",
      ],
    );
    assert.deepEqual([...HALL_RENTAL_ADMIN_ROLES], ["administrator", "platform_admin"]);
  });

  it("commits local hall webp photos and drops svg mocks", () => {
    const mediaDir = fileURLToPath(new URL("../../../public/media/arenda", import.meta.url));
    const names = readdirSync(mediaDir);
    assert.ok(!names.some((name) => name.endsWith(".svg")));
    for (const photo of HALL_RENTAL_PHOTOS) {
      const file = fileURLToPath(new URL(`../../../public${photo.src}`, import.meta.url));
      assert.equal(existsSync(file), true, `missing ${photo.src}`);
    }

    const landing = readFileSync(fileURLToPath(new URL("../../screens/landing/arenda.tsx", import.meta.url)), "utf8");
    const media = readFileSync(fileURLToPath(new URL("../../components/hall-rental-media.tsx", import.meta.url)), "utf8");
    const catalog = readFileSync(fileURLToPath(new URL("./hall-rental.ts", import.meta.url)), "utf8");
    const page = readFileSync(fileURLToPath(new URL("../../app/arenda/page.tsx", import.meta.url)), "utf8");
    assert.match(media, /object-cover/);
    assert.match(landing, /HALL_RENTAL_HALLS/);
    assert.match(landing, /HallFilmstrip/);
    assert.match(media, /Предыдущее фото/);
    assert.match(media, /Следующее фото/);
    assert.match(catalog, /Зал УШУ/);
    assert.match(catalog, /Зал фехтования/);
    assert.match(page, /HallRentalMedia/);
    assert.doesNotMatch(landing, /\.svg/);
    assert.doesNotMatch(page, /\.svg/);
    assert.doesNotMatch(media, /\.svg/);
  });
});

describe("hall picker and filmstrip", () => {
  it("switches specs between the wushu hall and a fencing mock", () => {
    assert.deepEqual(
      HALL_RENTAL_HALLS.map((hall) => hall.label),
      ["Зал УШУ", "Зал фехтования"],
    );
    const ushu = HALL_RENTAL_HALLS[0];
    const fencing = HALL_RENTAL_HALLS[1];
    assert.equal(ushu.mock, false);
    assert.equal(fencing.mock, true);
    for (const hall of [ushu, fencing]) {
      assert.deepEqual(
        hall.specs.map((spec) => spec.label),
        ["Цена", "Площадь"],
      );
      assert.equal(hall.specs[0].value, HALL_RENTAL_FACTS.price);
      assert.equal(hall.specs[1].value, HALL_RENTAL_FACTS.area);
    }
    const landing = readFileSync(fileURLToPath(new URL("../../screens/landing/arenda.tsx", import.meta.url)), "utf8");
    const page = readFileSync(fileURLToPath(new URL("../../app/arenda/page.tsx", import.meta.url)), "utf8");
    assert.doesNotMatch(landing, /hall\.note|Зеркала|Покрытие|ласточкин хвост/);
    assert.match(page, /Зеркала/);
    assert.match(page, /Покрытие/);
    assert.match(page, /ласточкин хвост/);
    assert.match(page, /promo-card/);
    assert.doesNotMatch(page, /hall-spec/);
    assert.match(page, /HallRentalForm/);
    const factsAt = page.indexOf("FACTS.map");
    const mediaAt = page.indexOf("<HallRentalMedia");
    const formAt = page.indexOf("<HallRentalForm");
    assert.ok(factsAt >= 0 && mediaAt > factsAt && formAt > factsAt);
    assert.ok(fencing.photos.every((photo) => HALL_RENTAL_PHOTOS.some((item) => item.src === photo.src)));
    assert.notEqual(fencing.photos[0].src, ushu.photos[0].src);
    assert.match(landing, /HALL_RENTAL_HALLS\[0\]\.photos/);
    assert.match(landing, /peek/);
    assert.doesNotMatch(landing, /photos=\{hall\.photos\}/);
    assert.doesNotMatch(page, /peek/);
    const css = readFileSync(fileURLToPath(new URL("../../screens/landing/styles.css", import.meta.url)), "utf8");
    const media = readFileSync(fileURLToPath(new URL("../../components/hall-rental-media.tsx", import.meta.url)), "utf8");
    assert.match(css, /#arenda \.hall-spec[\s\S]*background:\s*var\(--void\)/);
    assert.match(css, /#arenda \.hall-spec[\s\S]*width:\s*max-content/);
    assert.match(landing, /mobileSpecLine/);
    assert.match(landing, /spec\.label === "Площадь" \? "площадь"/);
    assert.match(landing, /hall-spec-short/);
    assert.match(css, /#arenda \.hall-spec-short \{\s*display:\s*none/);
    assert.match(css, /#arenda \.hall-rental-lead h2 \{\s*font-size:\s*clamp\(1\.35rem, 7vw, 1\.7rem\);\s*white-space:\s*nowrap/);
    assert.match(css, /#arenda \.hall-rental-lead \.hall-chip-row \{\s*flex-wrap:\s*nowrap/);
    assert.match(css, /#arenda \.hall-spec-short \{\s*display:\s*block/);
    assert.match(media, /useHorizontalSwipe/);
    assert.match(css, /#arenda \.hall-filmstrip,\s*#tariffs \.tariff-swipe \{\s*touch-action:\s*pan-y/);
    assert.match(css, /hall-filmstrip--peek[\s\S]*width:\s*200%/);
    assert.match(css, /hall-filmstrip-dot/);
    assert.match(css, /\.hall-slide-track \{[^}]*transition:\s*transform [^;]*ease/);
    assert.match(media, /hall-slide-track/);
    assert.match(media, /--hall-pos/);
    const topBlocks = css.match(/#arenda \.hall-rental-top \{[^}]*\}/g) ?? [];
    assert.ok(topBlocks.length >= 2);
    for (const block of topBlocks) {
      assert.doesNotMatch(block, /margin-right:\s*-|width:\s*calc\(100% \+/);
    }
    assert.match(css, /#arenda \.hall-filmstrip-block \{[^}]*margin-left:\s*-1\.1rem/);
    assert.match(css, /#arenda \.hall-filmstrip-block \{[^}]*margin-left:\s*-2rem/);
    assert.match(css, /is-side \{[^}]*height:\s*12rem/);
    assert.match(css, /is-center \{[^}]*height:\s*14\.5rem/);
    assert.match(css, /is-side \{[^}]*height:\s*18rem/);
    assert.match(css, /is-center \{[^}]*height:\s*22rem/);
  });

  it("loops the filmstrip in both directions", () => {
    assert.equal(stepHallPhoto(0, -1, 4), 3);
    assert.equal(stepHallPhoto(3, 1, 4), 0);
    assert.equal(stepHallPhoto(1, 1, 4), 2);
    assert.equal(stepHallPhoto(2, -1, 4), 1);
  });
});

describe("validateHallRentalInput", () => {
  it("accepts a complete request and normalizes phone", () => {
    const result = validateHallRentalInput(valid);
    assert.equal(result.ok, true);
    if (!result.ok) return;
    assert.deepEqual(result.value.days, ["mon", "wed"]);
    assert.equal(result.value.phone, "+79151234567");
    assert.equal(result.value.destinedRoles[0], "administrator");
  });

  it("rejects empty days, bad time and short phone", () => {
    const result = validateHallRentalInput({
      ...valid,
      days: [],
      startTime: "25:99",
      phone: "123",
      cadence: "sometimes",
      hours: 0,
      name: " ",
    });
    assert.equal(result.ok, false);
    if (result.ok) return;
    assert.ok(result.errors.days);
    assert.ok(result.errors.startTime);
    assert.ok(result.errors.phone);
    assert.ok(result.errors.cadence);
    assert.ok(result.errors.hours);
    assert.ok(result.errors.name);
  });

  it("drops unknown days and optional invalid email", () => {
    const badEmail = validateHallRentalInput({ ...valid, email: "not-an-email" });
    assert.equal(badEmail.ok, false);
    const cleaned = validateHallRentalInput({ ...valid, days: ["mon", "nope", "mon"], email: "" });
    assert.equal(cleaned.ok, true);
    if (!cleaned.ok) return;
    assert.deepEqual(cleaned.value.days, ["mon"]);
    assert.equal(cleaned.value.email, undefined);
  });
});

describe("normalizePhone", () => {
  it("maps 8XXXXXXXXXX and 10 digits to +7", () => {
    assert.equal(normalizePhone("8 (915) 123-45-67"), "+79151234567");
    assert.equal(normalizePhone("9151234567"), "+79151234567");
  });
});

describe("parseBearerToken", () => {
  it("parses Bearer tokens and rejects empty", () => {
    assert.equal(parseBearerToken("Bearer abc.def"), "abc.def");
    assert.equal(parseBearerToken("bearer xyz"), "xyz");
    assert.equal(parseBearerToken("Basic x"), null);
    assert.equal(parseBearerToken(null), null);
  });
});
