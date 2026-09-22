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
  groupKey?: string;
  startsAt: string;
  endsAt: string;
  capacity: number;
  enrolled: number;
  coachId?: string;
  studentIds?: string[];
  notes?: string;
  cancelled?: boolean;
};

export type HallRow = { id: string; name: string };

export type GroupRow = {
  id: string;
  name: string;
  coachId?: string;
  direction?: string;
  studentIds?: string[];
};

export type SessionAttendanceRow = {
  sessionId: string;
  studentId: string;
  present: boolean;
  resultNotes?: string;
  markedAt: string;
  markedBy?: string;
};

export type PaymentListRow = PaymentRow & {
  orderId?: string;
  createdAt?: string;
  currency?: string;
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

export async function fetchPublicSchedule(params?: {
  from?: string;
  to?: string;
  coachId?: string;
}): Promise<SessionRow[]> {
  const q = new URLSearchParams();
  if (params?.from) q.set("from", params.from);
  if (params?.to) q.set("to", params.to);
  if (params?.coachId) q.set("coachId", params.coachId);
  const qs = q.toString();
  const res = await fetch(`${SCHOOL_API}/v1/schedule/sessions${qs ? `?${qs}` : ""}`);
  return parseJson(res);
}

export async function fetchHalls(): Promise<HallRow[]> {
  const res = await fetch(`${SCHOOL_API}/v1/halls`);
  return parseJson(res);
}

export async function upsertHall(user: SessionUser, hall: Partial<HallRow> & { name: string }): Promise<HallRow> {
  const res = await fetch(`${SCHOOL_API}/v1/admin/halls`, {
    method: "POST",
    headers: authHeaders(user),
    body: JSON.stringify(hall),
  });
  return parseJson(res);
}

export async function createAdminSession(
  user: SessionUser,
  body: {
    title: string;
    hallId: string;
    startsAt: string;
    endsAt: string;
    capacity?: number;
    coachId?: string;
    groupKey?: string;
    studentIds?: string[];
    notes?: string;
  },
): Promise<SessionRow> {
  const res = await fetch(`${SCHOOL_API}/v1/admin/schedule/sessions`, {
    method: "POST",
    headers: authHeaders(user),
    body: JSON.stringify(body),
  });
  return parseJson(res);
}

export async function cancelAdminSession(user: SessionUser, sessionId: string): Promise<void> {
  const res = await fetch(`${SCHOOL_API}/v1/admin/schedule/sessions/${encodeURIComponent(sessionId)}`, {
    method: "DELETE",
    headers: authHeaders(user),
  });
  await parseJson(res);
}

export async function enrollStudent(
  user: SessionUser,
  sessionId: string,
  studentId: string,
): Promise<SessionRow> {
  const res = await fetch(`${SCHOOL_API}/v1/admin/schedule/sessions/${encodeURIComponent(sessionId)}/enroll`, {
    method: "POST",
    headers: authHeaders(user),
    body: JSON.stringify({ studentId }),
  });
  return parseJson(res);
}

export async function unenrollStudent(
  user: SessionUser,
  sessionId: string,
  studentId: string,
): Promise<SessionRow> {
  const res = await fetch(`${SCHOOL_API}/v1/admin/schedule/sessions/${encodeURIComponent(sessionId)}/unenroll`, {
    method: "POST",
    headers: authHeaders(user),
    body: JSON.stringify({ studentId }),
  });
  return parseJson(res);
}

export async function fetchGroups(user: SessionUser): Promise<GroupRow[]> {
  const res = await fetch(`${SCHOOL_API}/v1/groups`, { headers: authHeaders(user) });
  return parseJson(res);
}

export async function upsertGroup(user: SessionUser, group: Partial<GroupRow> & { name: string }): Promise<GroupRow> {
  const path = group.id
    ? `${SCHOOL_API}/v1/admin/groups/${encodeURIComponent(group.id)}`
    : `${SCHOOL_API}/v1/admin/groups`;
  const res = await fetch(path, {
    method: group.id ? "PUT" : "POST",
    headers: authHeaders(user),
    body: JSON.stringify(group),
  });
  return parseJson(res);
}

export async function deleteGroup(user: SessionUser, id: string): Promise<void> {
  const res = await fetch(`${SCHOOL_API}/v1/admin/groups/${encodeURIComponent(id)}`, {
    method: "DELETE",
    headers: authHeaders(user),
  });
  await parseJson(res);
}

export async function fetchSessionAttendance(
  user: SessionUser,
  sessionId: string,
): Promise<SessionAttendanceRow[]> {
  const res = await fetch(`${SCHOOL_API}/v1/schedule/sessions/${encodeURIComponent(sessionId)}/attendance`, {
    headers: authHeaders(user),
  });
  return parseJson(res);
}

export async function markSessionAttendance(
  user: SessionUser,
  sessionId: string,
  body: { studentId: string; present: boolean; resultNotes?: string },
): Promise<SessionAttendanceRow> {
  const res = await fetch(`${SCHOOL_API}/v1/schedule/sessions/${encodeURIComponent(sessionId)}/attendance`, {
    method: "POST",
    headers: authHeaders(user),
    body: JSON.stringify(body),
  });
  return parseJson(res);
}

export async function sendNotification(
  user: SessionUser,
  body: { purpose: string; channel: string; recipient: string; templateKey: string },
): Promise<{ id?: string }> {
  const res = await fetch(`${SCHOOL_API}/v1/comms/send`, {
    method: "POST",
    headers: authHeaders(user),
    body: JSON.stringify({
      purpose: body.purpose,
      channel: body.channel,
      recipient: body.recipient,
      template: body.templateKey,
    }),
  });
  return parseJson(res);
}

export async function fetchCommsLog(user: SessionUser): Promise<string[]> {
  const res = await fetch(`${SCHOOL_API}/v1/comms/log`, { headers: authHeaders(user) });
  return parseJson(res);
}

export async function fetchPayments(user: SessionUser): Promise<PaymentListRow[]> {
  const res = await fetch(`${SCHOOL_API}/v1/commerce/payments`, { headers: authHeaders(user) });
  return parseJson(res);
}

export async function fetchPaymentProvider(): Promise<{ provider: string; live: boolean }> {
  const res = await fetch(`${SCHOOL_API}/v1/commerce/provider`);
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
