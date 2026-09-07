import assert from "node:assert/strict";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { describe, it } from "node:test";
import { fileURLToPath } from "node:url";

import {
  HALL_RENTAL_ADMIN_ROLES,
  HALL_RENTAL_FACTS,
  HALL_RENTAL_PHOTOS,
  normalizePhone,
  parseBearerToken,
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
    const page = readFileSync(fileURLToPath(new URL("../../app/arenda/page.tsx", import.meta.url)), "utf8");
    assert.match(landing, /object-cover/);
    assert.match(page, /object-cover/);
    assert.doesNotMatch(landing, /\.svg/);
    assert.doesNotMatch(page, /\.svg/);
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
