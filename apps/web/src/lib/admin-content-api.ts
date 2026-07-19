import { SCHOOL_API } from "@/lib/utils";
import { authHeaders, type SessionUser } from "@/lib/session";

export type Quest = {
  key: string;
  title: string;
  type: string;
  xp: number;
  coins?: number;
  description?: string;
};
export type Achievement = {
  key: string;
  title: string;
  tiers: number | number[];
  xp: number;
  coins?: number;
  description?: string;
};
export type Talent = { key: string; title: string; rank: number };
export type ContentItem = { key: string; title: string; type: string; category: string };
export type RewardBundle = { key: string; title: string; components: string };
export type School = { key: string; title: string; description: string };

export type ContentCatalog = {
  quests: Quest[];
  achievements: Achievement[];
  talents: Talent[];
  items: ContentItem[];
  rewards: RewardBundle[];
  schools: School[];
};

export type ContentEntity =
  | "quests"
  | "achievements"
  | "talents"
  | "items"
  | "rewards"
  | "schools";

export async function fetchContentCatalog(user: SessionUser): Promise<ContentCatalog> {
  const res = await fetch(`${SCHOOL_API}/v1/admin/content`, { headers: authHeaders(user) });
  if (!res.ok) throw new Error("load_failed");
  const data = (await res.json()) as Partial<ContentCatalog>;
  return {
    quests: data.quests ?? [],
    achievements: data.achievements ?? [],
    talents: data.talents ?? [],
    items: data.items ?? [],
    rewards: data.rewards ?? [],
    schools: data.schools ?? [],
  };
}

export async function upsertContentEntity(
  user: SessionUser,
  entity: ContentEntity,
  payload: Record<string, unknown>,
  editingKey?: string | null,
): Promise<void> {
  const url = editingKey
    ? `${SCHOOL_API}/v1/admin/content/${entity}/${encodeURIComponent(editingKey)}`
    : `${SCHOOL_API}/v1/admin/content/${entity}`;
  const res = await fetch(url, {
    method: editingKey ? "PUT" : "POST",
    headers: authHeaders(user),
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error("save_failed");
}

export async function deleteContentEntity(
  user: SessionUser,
  entity: ContentEntity,
  key: string,
): Promise<void> {
  const res = await fetch(`${SCHOOL_API}/v1/admin/content/${entity}/${encodeURIComponent(key)}`, {
    method: "DELETE",
    headers: authHeaders(user),
  });
  if (!res.ok) throw new Error("delete_failed");
}

export type ValidationReport = {
  ok: boolean;
  issues: { level: string; entity: string; key?: string; message: string }[];
  counts: Record<string, number>;
};

export async function validateContentCatalog(user: SessionUser): Promise<ValidationReport> {
  const res = await fetch(`${SCHOOL_API}/v1/admin/content/validate`, { headers: authHeaders(user) });
  if (!res.ok) throw new Error("validate_failed");
  return (await res.json()) as ValidationReport;
}

export type SimulationResult = {
  questKey: string;
  target: number;
  sampleXp: number;
  eligible: boolean;
  explanation: string;
};

export async function simulateQuest(
  user: SessionUser,
  questKey: string,
  progress: number,
): Promise<SimulationResult> {
  const res = await fetch(
    `${SCHOOL_API}/v1/admin/content/simulate?questKey=${encodeURIComponent(questKey)}&progress=${progress}`,
    { headers: authHeaders(user) },
  );
  if (!res.ok) throw new Error("simulate_failed");
  return (await res.json()) as SimulationResult;
}

export type ReleaseInfo = {
  bundleKey: string;
  bundleVersion: number;
  status: string;
  killSwitches: Record<string, boolean>;
};

export async function fetchReleaseInfo(user: SessionUser): Promise<ReleaseInfo> {
  const res = await fetch(`${SCHOOL_API}/v1/studio/release`, { headers: authHeaders(user) });
  if (!res.ok) throw new Error("release_failed");
  return (await res.json()) as ReleaseInfo;
}
