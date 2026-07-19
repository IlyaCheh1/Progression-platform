import { SCHOOL_API } from "@/lib/utils";
import { authHeaders, type SessionUser } from "@/lib/session";

export type MasteryTrack = {
  weaponKey: string;
  units: number;
  points: number;
  rank: number;
  floorUnits: number;
};

export type QuestProgress = {
  questKey: string;
  progress: number;
  target: number;
  completed: boolean;
};

export type AchievementState = {
  key: string;
  tier: number;
  maxTier: number;
  unlocked: boolean;
};

export type SessionRow = {
  id: string;
  title: string;
  hallId: string;
  startsAt: string;
  endsAt: string;
  capacity: number;
  enrolled: number;
};

export type Tariff = {
  key: string;
  title: string;
  amountMinor: number;
  currency: string;
};

export type PaymentRow = {
  id: string;
  status: string;
  amountMinor: number;
  confirmationUrl?: string;
  providerPaymentId?: string;
};

async function parseJson<T>(res: Response): Promise<T> {
  if (!res.ok) {
    throw new Error(`API ${res.status}`);
  }
  return (await res.json()) as T;
}

export async function fetchMastery(user: SessionUser): Promise<MasteryTrack[]> {
  const res = await fetch(`${SCHOOL_API}/v1/mastery/me`, { headers: authHeaders(user) });
  return parseJson(res);
}

export async function fetchQuests(user: SessionUser): Promise<QuestProgress[]> {
  const res = await fetch(`${SCHOOL_API}/v1/quests/me`, { headers: authHeaders(user) });
  return parseJson(res);
}

export async function fetchAchievements(user: SessionUser): Promise<AchievementState[]> {
  const res = await fetch(`${SCHOOL_API}/v1/achievements/me`, { headers: authHeaders(user) });
  return parseJson(res);
}

export async function fetchPublicSchedule(): Promise<SessionRow[]> {
  const res = await fetch(`${SCHOOL_API}/v1/schedule/sessions`);
  return parseJson(res);
}

export async function fetchTariffs(): Promise<Tariff[]> {
  const res = await fetch(`${SCHOOL_API}/v1/commerce/tariffs`);
  return parseJson(res);
}

export async function checkoutMembership(user: SessionUser, tariffKey: string): Promise<PaymentRow> {
  const res = await fetch(`${SCHOOL_API}/v1/checkout/membership`, {
    method: "POST",
    headers: authHeaders(user),
    body: JSON.stringify({ tariffKey, returnUrl: `${window.location.origin}/membership` }),
  });
  return parseJson(res);
}

export async function fetchMembership(user: SessionUser): Promise<{ active: boolean }> {
  const res = await fetch(`${SCHOOL_API}/v1/commerce/membership/me`, { headers: authHeaders(user) });
  return parseJson(res);
}

export async function bookTrial(user: SessionUser, sessionId: string): Promise<{ id: string; status: string }> {
  const res = await fetch(`${SCHOOL_API}/v1/bookings/trial`, {
    method: "POST",
    headers: authHeaders(user),
    body: JSON.stringify({ sessionId }),
  });
  return parseJson(res);
}

export async function fetchLeads(user: SessionUser): Promise<unknown[]> {
  const res = await fetch(`${SCHOOL_API}/v1/crm/leads`, { headers: authHeaders(user) });
  return parseJson(res);
}

export async function createLead(data: {
  name: string;
  phone?: string;
  email?: string;
  source?: string;
  utm?: string;
  direction?: string;
}): Promise<{ id: string }> {
  const res = await fetch(`${SCHOOL_API}/v1/public/leads`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return parseJson(res);
}
