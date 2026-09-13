import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

import type { LandingLeadRequest } from "@/lib/landing/lead";

export function landingLeadStorePath(): string {
  const fromEnv = process.env.LANDING_LEAD_STORE_PATH?.trim();
  if (fromEnv) return fromEnv;
  return path.join(process.cwd(), ".data", "landing-leads.json");
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

async function readAll(filePath: string): Promise<LandingLeadRequest[]> {
  try {
    const raw = await readFile(filePath, "utf8");
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? (parsed as LandingLeadRequest[]) : [];
  } catch (error) {
    const code = error && typeof error === "object" && "code" in error ? String(error.code) : "";
    if (code === "ENOENT") return [];
    throw error;
  }
}

export async function listLandingLeads(filePath = landingLeadStorePath()): Promise<LandingLeadRequest[]> {
  const rows = await readAll(filePath);
  return [...rows].sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
}

export async function appendLandingLead(
  request: LandingLeadRequest,
  filePath = landingLeadStorePath(),
): Promise<LandingLeadRequest> {
  return enqueue(async () => {
    await mkdir(path.dirname(filePath), { recursive: true });
    const rows = await readAll(filePath);
    rows.push(request);
    await writeFile(filePath, `${JSON.stringify(rows, null, 2)}\n`, "utf8");
    return request;
  });
}

export function createLandingLeadId(): string {
  const rand = Math.random().toString(36).slice(2, 8);
  return `lead_${Date.now()}_${rand}`;
}
