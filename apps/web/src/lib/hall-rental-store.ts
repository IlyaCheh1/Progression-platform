import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

import type { HallRentalRequest } from "./landing/hall-rental";

export function hallRentalStorePath(): string {
  const fromEnv = process.env.HALL_RENTAL_STORE_PATH?.trim();
  if (fromEnv) return fromEnv;
  return path.join(process.cwd(), ".data", "hall-rental-requests.json");
}

let writeQueue: Promise<unknown> = Promise.resolve();

function enqueue<T>(fn: () => Promise<T>): Promise<T> {
  const next = writeQueue.then(fn, fn);
  writeQueue = next.then(
    () => undefined,
    () => undefined,
  );
  return next;
}

async function readAll(filePath: string): Promise<HallRentalRequest[]> {
  try {
    const raw = await readFile(filePath, "utf8");
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? (parsed as HallRentalRequest[]) : [];
  } catch (error) {
    const code = error && typeof error === "object" && "code" in error ? String(error.code) : "";
    if (code === "ENOENT") return [];
    throw error;
  }
}

export async function listHallRentalRequests(filePath = hallRentalStorePath()): Promise<HallRentalRequest[]> {
  const rows = await readAll(filePath);
  return [...rows].sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
}

export async function appendHallRentalRequest(
  request: HallRentalRequest,
  filePath = hallRentalStorePath(),
): Promise<HallRentalRequest> {
  return enqueue(async () => {
    await mkdir(path.dirname(filePath), { recursive: true });
    const rows = await readAll(filePath);
    rows.push(request);
    await writeFile(filePath, `${JSON.stringify(rows, null, 2)}\n`, "utf8");
    return request;
  });
}

export function createHallRentalId(): string {
  const rand = Math.random().toString(36).slice(2, 8);
  return `hr_${Date.now()}_${rand}`;
}
