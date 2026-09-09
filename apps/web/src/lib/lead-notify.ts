import { schoolApiBaseUrl } from "@/lib/onlyid/sso";
import type { LandingLeadRequest } from "@/lib/landing/lead";

export type LandingLeadNotifyResult = {
  logged: true;
  crmLeadId: string | null;
};

/** Stub: log for ops, best-effort CRM lead. No PII in logs. */
export async function notifyLandingLead(request: LandingLeadRequest): Promise<LandingLeadNotifyResult> {
  console.info("[landing-lead] new request", {
    id: request.id,
    source: request.source,
    direction: request.direction ?? "",
    hasEmail: Boolean(request.email),
    hasComment: Boolean(request.comment),
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
        source: request.source,
        direction: request.direction ?? "adults",
        utm: request.comment ? "comment" : "",
      }),
    });
    if (res.ok) {
      const data = (await res.json()) as { id?: string };
      crmLeadId = typeof data.id === "string" ? data.id : null;
    }
  } catch {
    // school-api is optional for the public form
  }

  return { logged: true, crmLeadId };
}
