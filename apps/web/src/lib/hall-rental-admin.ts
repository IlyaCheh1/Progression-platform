import { parseBearerToken } from "./landing/hall-rental";
import { schoolApiBaseUrl } from "./onlyid/sso";

export type AdminAuthResult =
  | { ok: true; login: string }
  | { ok: false; status: 401 | 403 | 503 };

export async function requireHallRentalAdmin(authorization: string | null): Promise<AdminAuthResult> {
  const token = parseBearerToken(authorization);
  if (!token) return { ok: false, status: 401 };

  const base = schoolApiBaseUrl();
  try {
    const me = await fetch(`${base}/v1/admin/students`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
      signal: AbortSignal.timeout(4000),
    });
    if (me.status === 401) return { ok: false, status: 401 };
    if (me.status === 403) return { ok: false, status: 403 };
    if (!me.ok) return { ok: false, status: 503 };

    const profile = await fetch(`${base}/v1/profile/me`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
      signal: AbortSignal.timeout(4000),
    });
    const body = profile.ok ? ((await profile.json()) as { username?: string; displayName?: string }) : {};
    return { ok: true, login: body.username || body.displayName || "admin" };
  } catch {
    return { ok: false, status: 503 };
  }
}
