import { SCHOOL_API } from "@/lib/utils";
import { authHeaders, type SessionUser } from "@/lib/session";

export type SupportCase = {
  id: string;
  studentId: string;
  subject: string;
  status: string;
  trainingRecordId?: string;
  messages: Array<{ id: string; authorId: string; body: string; createdAt: string }>;
  createdAt: string;
};

export async function fetchMySupportCases(user: SessionUser): Promise<SupportCase[]> {
  const res = await fetch(`${SCHOOL_API}/v1/support/cases/me`, { headers: authHeaders(user) });
  if (!res.ok) return [];
  return (await res.json()) as SupportCase[];
}

export async function createSupportCase(user: SessionUser, subject: string, body: string): Promise<SupportCase> {
  const res = await fetch(`${SCHOOL_API}/v1/support/cases`, {
    method: "POST",
    headers: authHeaders(user),
    body: JSON.stringify({ subject, body }),
  });
  if (!res.ok) throw new Error("create_failed");
  return (await res.json()) as SupportCase;
}
