import assert from "node:assert/strict";
import { mkdtemp, readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { describe, it } from "node:test";

import { appendHallRentalRequest, listHallRentalRequests } from "./hall-rental-store.ts";

describe("hall rental store", () => {
  it("persists and lists newest first", async () => {
    const dir = await mkdtemp(path.join(tmpdir(), "hall-rental-"));
    const filePath = path.join(dir, "requests.json");
    const first = await appendHallRentalRequest(
      {
        id: "hr_1",
        createdAt: "2026-09-01T10:00:00.000Z",
        days: ["mon"],
        startTime: "10:00",
        hours: 1,
        cadence: "one_time",
        name: "Аня",
        phone: "+79001112233",
        destinedRoles: ["administrator", "platform_admin"],
        source: "public-landing",
      },
      filePath,
    );
    await appendHallRentalRequest(
      {
        ...first,
        id: "hr_2",
        createdAt: "2026-09-02T10:00:00.000Z",
        name: "Борис",
      },
      filePath,
    );

    const listed = await listHallRentalRequests(filePath);
    assert.equal(listed[0]?.id, "hr_2");
    assert.equal(listed[1]?.name, "Аня");
    const raw = await readFile(filePath, "utf8");
    assert.match(raw, /hr_1/);
  });
});
