import { NextRequest, NextResponse } from "next/server";

import { validateLandingLeadInput, type LandingLeadRequest } from "@/lib/landing/lead";
import { notifyLandingLead } from "@/lib/lead-notify";
import { appendLandingLead, createLandingLeadId, listLandingLeads } from "@/lib/lead-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const RATE_WINDOW_MS = 10 * 60 * 1000;
const RATE_MAX = 8;
const STORE_CAP = 2000;
const hits = new Map<string, number[]>();

function clientKey(request: NextRequest): string {
  const realIp = request.headers.get("x-real-ip")?.trim();
  if (realIp) return realIp;
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    const hops = forwarded.split(",").map((part) => part.trim()).filter(Boolean);
    if (hops.length > 0) return hops[hops.length - 1] ?? "local";
  }
  return "local";
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

  const parsed = validateLandingLeadInput(raw);
  if (!parsed.ok) {
    return NextResponse.json({ error: "validation_failed", errors: parsed.errors }, { status: 400 });
  }

  const existing = await listLandingLeads();
  if (existing.length >= STORE_CAP) {
    return NextResponse.json({ error: "store_full" }, { status: 503 });
  }

  const record: LandingLeadRequest = {
    ...parsed.value,
    id: createLandingLeadId(),
    createdAt: new Date().toISOString(),
  };

  try {
    await appendLandingLead(record);
  } catch (error) {
    console.error("[landing-lead] store failed", error instanceof Error ? error.message : "unknown");
    return NextResponse.json({ error: "store_failed" }, { status: 500 });
  }

  await notifyLandingLead(record);
  return NextResponse.json({
    id: record.id,
    createdAt: record.createdAt,
  });
}
