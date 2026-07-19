import { SCHOOL_API } from "@/lib/utils";
import { authHeaders, type SessionUser } from "@/lib/session";
import type { TalentCatalogResponse } from "@/lib/talents-catalog";

export type { TalentCatalogResponse };

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

export async function fetchTalentCatalog(): Promise<TalentCatalogResponse> {
  const res = await fetch(`${SCHOOL_API}/v1/talents/catalog`);
  return parseJson(res);
}

export async function fetchUnlockedTalents(user: SessionUser): Promise<string[]> {
  const res = await fetch(`${SCHOOL_API}/v1/talents/me/unlocked`, { headers: authHeaders(user) });
  return parseJson(res);
}

export async function unlockTalent(user: SessionUser, talentKey: string): Promise<void> {
  const res = await fetch(`${SCHOOL_API}/v1/talents/unlock`, {
    method: "POST",
    headers: { ...authHeaders(user), "Content-Type": "application/json" },
    body: JSON.stringify({ talentKey }),
  });
  if (!res.ok) {
    throw new Error(`API ${res.status}`);
  }
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

export type RentalBooking = {
  id: string;
  type: string;
  status: string;
  createdAt: string;
};

export type HallSlot = {
  id: string;
  hallId: string;
  type: string;
  startsAt: string;
  endsAt: string;
};

export async function fetchRenterBookings(user: SessionUser): Promise<RentalBooking[]> {
  const res = await fetch(`${SCHOOL_API}/v1/renter/bookings`, { headers: authHeaders(user) });
  return parseJson(res);
}

export async function fetchHallAvailability(hallId: string): Promise<HallSlot[]> {
  const res = await fetch(`${SCHOOL_API}/v1/halls/${encodeURIComponent(hallId)}/availability`);
  return parseJson(res);
}

export async function createRentalBooking(
  user: SessionUser,
  hallId: string,
  startsAt: string,
  endsAt: string,
): Promise<RentalBooking> {
  const res = await fetch(`${SCHOOL_API}/v1/bookings/rental`, {
    method: "POST",
    headers: authHeaders(user),
    body: JSON.stringify({ hallId, startsAt, endsAt }),
  });
  return parseJson(res);
}

export async function joinWaitlist(user: SessionUser, sessionId: string): Promise<{ id: string; position: number }> {
  const res = await fetch(`${SCHOOL_API}/v1/waitlist/join`, {
    method: "POST",
    headers: authHeaders(user),
    body: JSON.stringify({ sessionId }),
  });
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
