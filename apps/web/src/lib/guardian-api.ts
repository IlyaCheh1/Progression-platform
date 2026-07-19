import { SCHOOL_API } from "@/lib/utils";
import { authHeaders, type SessionUser } from "@/lib/session";

export type DependantSummary = {
  studentId: string;
  displayName: string;
  level: number;
  attendanceCount: number;
  maxRank: number;
  hasMembership: boolean;
  progressPrivate: boolean;
  schedule: Array<{ id: string; title: string; startsAt: string; endsAt: string }>;
  payments: Array<{ id: string; status: string; amountMinor: number }>;
};

export async function fetchDependants(user: SessionUser): Promise<DependantSummary[]> {
  const res = await fetch(`${SCHOOL_API}/v1/guardian/dependants`, { headers: authHeaders(user) });
  if (!res.ok) throw new Error("fetch_failed");
  return (await res.json()) as DependantSummary[];
}
