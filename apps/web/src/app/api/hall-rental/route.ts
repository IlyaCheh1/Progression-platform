import { NextRequest, NextResponse } from "next/server";

import { requireHallRentalAdmin } from "@/lib/hall-rental-admin";
import { notifyHallRentalAdmins } from "@/lib/hall-rental-notify";
import { appendHallRentalRequest, createHallRentalId, listHallRentalRequests } from "@/lib/hall-rental-store";
import { validateHallRentalInput, type HallRentalRequest } from "@/lib/landing/hall-rental";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const RATE_WINDOW_MS = 10 * 60 * 1000;
const RATE_MAX = 8;
const hits = new Map<string, number[]>();

function clientKey(request: NextRequest): string {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || request.headers.get("x-real-ip") || "local";
}

function rateLimited(key: string): boolean {
  const now = Date.now();
  const recent = (hits.get(key) ?? []).filter((ts) => now - ts < RATE_WINDOW_MS);
  if (recent.length >= RATE_MAX) {
    hits.set(key, recent);
    return true;
  }
  recent.push(now);
  hits.set(key, recent);
  return false;
}

export async function POST(request: NextRequest) {
  if (rateLimited(clientKey(request))) {
    return NextResponse.json({ error: "too_many_requests" }, { status: 429, headers: { "Retry-After": "120" } });
  }

  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return NextResponse.json({ error: "bad_request" }, { status: 400 });
  }

  const parsed = validateHallRentalInput(raw);
  if (!parsed.ok) {
    return NextResponse.json({ error: "validation_failed", errors: parsed.errors }, { status: 400 });
  }

  const record: HallRentalRequest = {
    ...parsed.value,
    id: createHallRentalId(),
    createdAt: new Date().toISOString(),
  };

  try {
    await appendHallRentalRequest(record);
  } catch (error) {
    console.error("[hall-rental] store failed", error instanceof Error ? error.message : "unknown");
    return NextResponse.json({ error: "store_failed" }, { status: 500 });
  }

  const notify = await notifyHallRentalAdmins(record);
  return NextResponse.json({
    id: record.id,
    createdAt: record.createdAt,
    destinedRoles: record.destinedRoles,
    notify,
  });
}

export async function GET(request: NextRequest) {
  const auth = await requireHallRentalAdmin(request.headers.get("authorization"));
  if (!auth.ok) {
    const message = auth.status === 401 ? "unauthorized" : auth.status === 403 ? "forbidden" : "school_api_unavailable";
    return NextResponse.json({ error: message }, { status: auth.status });
  }

  const items = await listHallRentalRequests();
  return NextResponse.json({ items, viewer: auth.login });
}
