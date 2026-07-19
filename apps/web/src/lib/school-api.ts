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

export type ClaimRewardResult = {
  ok: boolean;
  key: string;
  stageIndex?: number;
  xpGranted: number;
  coinsGranted?: number;
  alreadyClaimed: boolean;
  level: number;
  profile?: {
    level: number;
    xp: number;
    xpToNextLevel: number;
  };
};

export async function claimAchievement(
  user: SessionUser,
  key: string,
  stageIndex = 0,
): Promise<ClaimRewardResult> {
  const res = await fetch(`${SCHOOL_API}/v1/achievements/claim`, {
    method: "POST",
    headers: authHeaders(user),
    body: JSON.stringify({ key, stageIndex }),
  });
  return parseJson(res);
}

export async function claimQuest(user: SessionUser, key: string): Promise<ClaimRewardResult> {
  const res = await fetch(`${SCHOOL_API}/v1/quests/claim`, {
    method: "POST",
    headers: authHeaders(user),
    body: JSON.stringify({ key }),
  });
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

export class TalentUnlockError extends Error {
  readonly code: string;
  readonly status: number;

  constructor(status: number, code: string) {
    super(code);
    this.name = "TalentUnlockError";
    this.status = status;
    this.code = code;
  }
}

const TALENT_UNLOCK_MESSAGES: Record<string, string> = {
  unauthorized: "Сессия истекла. Войдите снова.",
  catalog_unavailable: "Каталог талантов недоступен",
  bad_request: "Некорректный запрос таланта",
  unknown_talent: "Талант не найден в каталоге",
  prerequisites_not_met: "Сначала изучите предыдущие умения",
  unlock_failed: "Не удалось сохранить талант на сервере",
};

export function messageForTalentUnlockError(error: unknown): string {
  if (error instanceof TalentUnlockError) {
    return TALENT_UNLOCK_MESSAGES[error.code] ?? `Ошибка изучения таланта (${error.status})`;
  }
  return "Не удалось сохранить талант на сервере";
}

export async function unlockTalent(user: SessionUser, talentKey: string): Promise<{ already?: boolean }> {
  const res = await fetch(`${SCHOOL_API}/v1/talents/unlock`, {
    method: "POST",
    headers: authHeaders(user),
    body: JSON.stringify({ talentKey }),
  });
  if (res.ok) {
    return (await res.json().catch(() => ({}))) as { already?: boolean };
  }
  let code = `API_${res.status}`;
  try {
    const body = (await res.json()) as { error?: string };
    if (body.error) code = body.error;
  } catch {
    /* ignore */
  }
  throw new TalentUnlockError(res.status, code);
}

/** Sync local learned talents to server (roots first via multi-pass). */
export async function syncLearnedTalents(user: SessionUser, learnedKeys: string[]): Promise<void> {
  let pending = [...learnedKeys];
  for (let pass = 0; pass < 6 && pending.length > 0; pass++) {
    const next: string[] = [];
    for (const key of pending) {
      try {
        await unlockTalent(user, key);
      } catch (error) {
        if (error instanceof TalentUnlockError && error.code === "prerequisites_not_met") {
          next.push(key);
          continue;
        }
        if (error instanceof TalentUnlockError && error.code === "unknown_talent") {
          continue;
        }
        throw error;
      }
    }
    if (next.length === pending.length) break;
    pending = next;
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
