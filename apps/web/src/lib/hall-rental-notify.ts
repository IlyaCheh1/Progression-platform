import { schoolApiBaseUrl } from "@/lib/onlyid/sso";
import type { HallRentalRequest } from "@/lib/landing/hall-rental";
import { labelForCadence, labelForDay } from "@/lib/landing/hall-rental";

export type HallRentalNotifyResult = {
  logged: true;
  emailTarget: string | null;
  crmLeadId: string | null;
};

function notifyEmailTarget(): string | null {
  const value = process.env.HALL_RENTAL_NOTIFY_EMAIL?.trim();
  return value || null;
}

/** Stub: log for ops, optional email env, best-effort CRM lead. No PII in logs. */
export async function notifyHallRentalAdmins(request: HallRentalRequest): Promise<HallRentalNotifyResult> {
  const emailTarget = notifyEmailTarget();
  console.info("[hall-rental] new request", {
    id: request.id,
    cadence: request.cadence,
    days: request.days,
    hours: request.hours,
    destinedRoles: request.destinedRoles,
    emailConfigured: Boolean(emailTarget),
  });

  let crmLeadId: string | null = null;
  try {
    const base = schoolApiBaseUrl();
    const res = await fetch(`${base}/v1/public/leads`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      signal: AbortSignal.timeout(2500),
      body: JSON.stringify({
        name: request.name,
        phone: request.phone,
        email: request.email ?? "",
        source: "hall-rental",
        direction: "arenda",
        utm: `${labelForCadence(request.cadence)} · ${request.days.map(labelForDay).join(",")}`,
      }),
    });
    if (res.ok) {
      const data = (await res.json()) as { id?: string };
      crmLeadId = typeof data.id === "string" ? data.id : null;
    }
  } catch {
    // school-api is optional for the public form
  }

  return { logged: true, emailTarget, crmLeadId };
}
