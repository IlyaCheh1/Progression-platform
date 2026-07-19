"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import AchievementStatistics from "@/components/achievements/statistics";
import SingleCard from "@/components/achievements/single-card";
import StackableCard, { type AchievementStage } from "@/components/achievements/stackable-card";
import TaskCard from "@/components/achievements/task-card";
import SideBar from "@/components/side-bar";
import Selector from "@/components/ui/selector";
import { content, rewardKindOf, rewardValueOf } from "@/lib/content";
import { achievementIconUrl, questIconUrl } from "@/lib/content-icons";
import { earnCoins } from "@/lib/coins";
import { claimAchievement as claimAchievementApi, claimQuest as claimQuestApi } from "@/lib/school-api";
import { fetchMyProfile, writeCachedProfile } from "@/lib/profile-api";
import { loadSession } from "@/lib/session";

type Mode = "achievements" | "tasks";

const CLAIMED_STORAGE_KEY = "mos.rewards.claimed.v1";

type ClaimedStore = {
  achievements: Record<string, boolean>;
  stages: Record<string, boolean>;
  quests: Record<string, boolean>;
};

function loadClaimedStore(): ClaimedStore {
  if (typeof window === "undefined") {
    return { achievements: {}, stages: {}, quests: {} };
  }
  try {
    const raw = window.localStorage.getItem(CLAIMED_STORAGE_KEY);
    if (!raw) return { achievements: {}, stages: {}, quests: {} };
    const parsed = JSON.parse(raw) as Partial<ClaimedStore>;
    return {
      achievements: parsed.achievements ?? {},
      stages: parsed.stages ?? {},
      quests: parsed.quests ?? {},
    };
  } catch {
    return { achievements: {}, stages: {}, quests: {} };
  }
}

function saveClaimedStore(store: ClaimedStore) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(CLAIMED_STORAGE_KEY, JSON.stringify(store));
}

function tiersToStages(
  key: string,
  tiers: number | number[],
  item: { xp?: number; coins?: number },
): AchievementStage[] {
  const list = Array.isArray(tiers) ? tiers : [tiers];
  const kind = rewardKindOf(item);
  return list.map((target, index) => ({
    id: `${key}:${index}`,
    reward:
      kind === "coins"
        ? rewardValueOf(item, index)
        : item.xp && item.xp > 0
          ? item.xp
          : 50 * (index + 1),
    rewardKind: kind,
    completed: false,
    claimed: false,
    current: 0,
    target,
  }));
}

export default function AchievementsPage() {
  const [mode, setMode] = useState<Mode>("achievements");
  const [filter, setFilter] = useState("ALL");
  const [pinned, setPinned] = useState<Record<string, boolean>>({});
  const [claimed, setClaimed] = useState<Record<string, boolean>>({});
  const [stageClaimed, setStageClaimed] = useState<Record<string, boolean>>({});
  const [questClaimed, setQuestClaimed] = useState<Record<string, boolean>>({});
  const [busyKey, setBusyKey] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const store = loadClaimedStore();
    setClaimed(store.achievements);
    setStageClaimed(store.stages);
    setQuestClaimed(store.quests);
  }, []);

  const persistClaimed = useCallback((next: ClaimedStore) => {
    setClaimed(next.achievements);
    setStageClaimed(next.stages);
    setQuestClaimed(next.quests);
    saveClaimedStore(next);
  }, []);

  const achievementFilters = [
    { id: "ALL", label: "Все" },
    { id: "start", label: "Старт" },
    { id: "practice", label: "Практика" },
    { id: "mastery", label: "Мастерство" },
    { id: "community", label: "Сообщество" },
    { id: "curriculum", label: "Учебник" },
  ];

  const taskFilters = [
    { id: "ALL", label: "Все" },
    { id: "DAILY", label: "Ежедневные" },
    { id: "WEEKLY", label: "Недельные" },
    { id: "MONTHLY", label: "Месячные" },
    { id: "SEASONAL", label: "Сезонные" },
    { id: "ONBOARDING", label: "Онбординг" },
  ];

  const achievements = useMemo(() => {
    return content.achievements
      .filter((a) => filter === "ALL" || a.key.startsWith(filter))
      .map((a) => {
        const stages = tiersToStages(a.key, a.tiers, a).map((stage, index, all) => {
          const isClaimed = !!stageClaimed[stage.id] || (!!claimed[a.key] && all.length === 1);
          const prevClaimed = index === 0 || !!stageClaimed[all[index - 1]?.id];
          return {
            ...stage,
            claimed: isClaimed,
            // Sandbox: первая незабранная ступень доступна к claim
            completed: isClaimed || (prevClaimed && !isClaimed),
          };
        });
        return { ...a, stages, rewardKind: rewardKindOf(a) };
      });
  }, [filter, claimed, stageClaimed]);

  const quests = useMemo(() => {
    if (filter === "ALL") return content.quests;
    return content.quests.filter((q) => q.type === filter);
  }, [filter]);

  const stats = useMemo(() => {
    const total = content.achievements.length;
    const completed = Object.keys(claimed).filter((k) => claimed[k]).length;
    const categories = achievementFilters
      .filter((f) => f.id !== "ALL")
      .map((f) => {
        const items = content.achievements.filter((a) => a.key.startsWith(f.id));
        return {
          id: f.id,
          name: f.label,
          completed: items.filter((a) => claimed[a.key]).length,
          total: items.length,
        };
      });
    return { overall: { completed, total }, categories };
  }, [claimed]);

  function togglePin(id: string) {
    setPinned((p) => ({ ...p, [id]: !p[id] }));
  }

  async function refreshProfile() {
    const session = loadSession();
    if (!session) return;
    const profile = await fetchMyProfile(session);
    if (profile) writeCachedProfile(profile);
  }

  async function claimAchievement(key: string, stages: AchievementStage[]) {
    const session = loadSession();
    if (!session) {
      setError("Войдите, чтобы получить награду");
      return;
    }

    const multi = Array.isArray(content.achievements.find((a) => a.key === key)?.tiers);
    let stageIndex = 0;
    let stageId = `${key}:0`;

    if (multi) {
      const next = stages.find((s) => s.completed && !s.claimed) ?? stages.find((s) => !s.claimed);
      if (!next) return;
      stageId = next.id;
      stageIndex = Math.max(0, stages.findIndex((s) => s.id === next.id));
    } else if (claimed[key]) {
      return;
    }

    setBusyKey(stageId);
    setError("");
    try {
      const result = await claimAchievementApi(session, key, stageIndex);
      if (!result.alreadyClaimed && (result.coinsGranted ?? 0) > 0) {
        earnCoins(result.coinsGranted ?? 0);
      }
      if (multi) {
        const updatedStages = { ...stageClaimed, [stageId]: true };
        const allDone = stages.every((s) => updatedStages[s.id] || s.claimed || s.id === stageId);
        persistClaimed({
          achievements: allDone ? { ...claimed, [key]: true } : claimed,
          stages: updatedStages,
          quests: questClaimed,
        });
      } else {
        persistClaimed({
          achievements: { ...claimed, [key]: true },
          stages: stageClaimed,
          quests: questClaimed,
        });
      }
      await refreshProfile();
    } catch {
      setError("Не удалось получить награду");
    } finally {
      setBusyKey("");
    }
  }

  async function claimQuest(key: string) {
    if (questClaimed[key]) return;
    const session = loadSession();
    if (!session) {
      setError("Войдите, чтобы получить награду");
      return;
    }

    setBusyKey(`quest:${key}`);
    setError("");
    try {
      const result = await claimQuestApi(session, key);
      if (!result.alreadyClaimed && (result.coinsGranted ?? 0) > 0) {
        earnCoins(result.coinsGranted ?? 0);
      }
      persistClaimed({
        achievements: claimed,
        stages: stageClaimed,
        quests: { ...questClaimed, [key]: true },
      });
      await refreshProfile();
    } catch {
      setError("Не удалось получить награду за задание");
    } finally {
      setBusyKey("");
    }
  }

  const sortedAchievements = [...achievements].sort((a, b) => {
    const ap = pinned[a.key] ? 0 : 1;
    const bp = pinned[b.key] ? 0 : 1;
    return ap - bp;
  });

  const sortedQuests = [...quests].sort((a, b) => {
    const ap = pinned[a.key] ? 0 : 1;
    const bp = pinned[b.key] ? 0 : 1;
    return ap - bp;
  });

  return (
    <main className="mx-auto flex min-w-full flex-col items-center gap-0 p-3 md:p-4">
      <Selector
        options={[
          { id: "achievements", label: "Достижения" },
          { id: "tasks", label: "Задания" },
        ]}
        activeId={mode}
        onChange={(id) => {
          setMode(id as Mode);
          setFilter("ALL");
        }}
        className="mx-auto"
      />

      {error ? <p className="mt-2 text-center text-sm text-mos-danger">{error}</p> : null}

      <div className="mt-4 flex w-full max-w-[1100px] flex-1 flex-col md:mt-6">
        <div className="flex flex-col gap-3 md:flex-row md:gap-6">
          <div className="flex w-full flex-col gap-3 md:w-[250px] md:shrink-0">
            <SideBar
              items={mode === "tasks" ? taskFilters : achievementFilters}
              activeId={filter}
              onChange={setFilter}
            />
            {mode === "achievements" ? <AchievementStatistics {...stats} /> : null}
          </div>

          <div className="mobile-game-scroll flex max-h-[calc(100lvh-140px)] flex-1 flex-col gap-3 overflow-y-auto pr-3 md:max-h-[calc(100lvh-200px)] md:gap-6 md:pr-4">
            {mode === "achievements"
              ? sortedAchievements.map((a) => {
                  const isStackable = Array.isArray(a.tiers) && a.tiers.length > 1;
                  if (isStackable) {
                    return (
                      <StackableCard
                        key={a.key}
                        title={a.title}
                        description={a.description || a.key}
                        iconUrl={achievementIconUrl(a.key, a.icon)}
                        stages={a.stages}
                        rewardKind={a.rewardKind}
                        pinned={!!pinned[a.key]}
                        onPin={() => togglePin(a.key)}
                        onClaim={() => void claimAchievement(a.key, a.stages)}
                      />
                    );
                  }
                  return (
                    <SingleCard
                      key={a.key}
                      title={a.title}
                      description={a.description || a.key}
                      iconUrl={achievementIconUrl(a.key, a.icon)}
                      current={1}
                      target={1}
                      reward={rewardValueOf(a)}
                      rewardKind={a.rewardKind}
                      claimed={!!claimed[a.key]}
                      pinned={!!pinned[a.key]}
                      onPin={() => togglePin(a.key)}
                      onClaim={() => void claimAchievement(a.key, a.stages)}
                    />
                  );
                })
              : sortedQuests.map((q) => (
                  <TaskCard
                    key={q.key}
                    title={q.title}
                    description={q.description || `${q.type} · ${q.key}`}
                    iconUrl={questIconUrl(q.key, q.icon)}
                    current={1}
                    target={1}
                    reward={rewardValueOf(q)}
                    rewardKind={rewardKindOf(q)}
                    claimed={!!questClaimed[q.key]}
                    pinned={!!pinned[q.key]}
                    onPin={() => togglePin(q.key)}
                    onClaim={() => void claimQuest(q.key)}
                  />
                ))}
          </div>
        </div>
      </div>
      {busyKey ? <span className="sr-only">Получаем награду…</span> : null}
    </main>
  );
}
