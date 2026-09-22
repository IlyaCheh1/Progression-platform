import { NextRequest, NextResponse } from "next/server";

import {
  buildIssuedRegistrationLink,
  createRegistrationInvite,
  parseInviteDraft,
  schoolUsersReadAccess,
} from "@/lib/auth/registration-invites";
import { getPublicOrigin } from "@/lib/onlyid/paths";
import { schoolApiBaseUrl } from "@/lib/onlyid/sso";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const access = await schoolUsersReadAccess(request.headers.get("authorization"), fetch, schoolApiBaseUrl());
  if (access === "forbidden") {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }
  if (access === "unavailable") {
    return NextResponse.json({ error: "school_unavailable" }, { status: 503 });
  }

  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return NextResponse.json({ error: "bad_request" }, { status: 400 });
  }

  const parsed = parseInviteDraft(raw);
  if (!parsed.ok) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  const invite = createRegistrationInvite(parsed.value);
  let origin: string;
  try {
    origin = getPublicOrigin(request.url);
  } catch {
    return NextResponse.json({ error: "site_url_missing" }, { status: 500 });
  }

  return NextResponse.json(buildIssuedRegistrationLink(origin, invite));
}
