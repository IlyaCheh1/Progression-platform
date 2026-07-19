"use client";

import { useMemo, useState } from "react";
import AchievementStatistics from "@/components/achievements/statistics";
import SingleCard from "@/components/achievements/single-card";
import StackableCard, { type AchievementStage } from "@/components/achievements/stackable-card";
import TaskCard from "@/components/achievements/task-card";
import SideBar from "@/components/side-bar";
import Selector from "@/components/ui/selector";
import { content } from "@/lib/content";
import { achievementIconUrl, questIconUrl } from "@/lib/content-icons";

type Mode = "achievements" | "tasks";

function tiersToStages(key: string, tiers: number | number[], xp: number): AchievementStage[] {
  const list = Array.isArray(tiers) ? tiers : [tiers];
  return list.map((target, index) => ({
    id: `${key}:${index}`,
    reward: xp || 50 * (index + 1),
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
        const stages = tiersToStages(a.key, a.tiers, a.xp).map((stage, index, all) => {
          const isClaimed = !!stageClaimed[stage.id] || (!!claimed[a.key] && all.length === 1);
          const prevClaimed = index === 0 || !!stageClaimed[all[index - 1]?.id];
          return {
            ...stage,
            claimed: isClaimed,
            // Sandbox: первая незабранная ступень доступна к claim
            completed: isClaimed || (prevClaimed && !isClaimed),
          };
        });
        return { ...a, stages };
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

  function claimAchievement(key: string, stages: AchievementStage[]) {
    const multi = Array.isArray(content.achievements.find((a) => a.key === key)?.tiers);
    if (multi) {
      const next = stages.find((s) => s.completed && !s.claimed) ?? stages.find((s) => !s.claimed);
      if (!next) return;
      setStageClaimed((prev) => {
        const updated = { ...prev, [next.id]: true };
        const allDone = stages.every((s) => updated[s.id] || s.claimed);
        if (allDone) setClaimed((c) => ({ ...c, [key]: true }));
        return updated;
      });
      return;
    }
    setClaimed((c) => ({ ...c, [key]: true }));
  }

  function claimQuest(key: string) {
    setClaimed((c) => ({ ...c, [key]: true }));
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
                        pinned={!!pinned[a.key]}
                        onPin={() => togglePin(a.key)}
                        onClaim={() => claimAchievement(a.key, a.stages)}
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
                      reward={a.xp || 100}
                      claimed={!!claimed[a.key]}
                      pinned={!!pinned[a.key]}
                      onPin={() => togglePin(a.key)}
                      onClaim={() => claimAchievement(a.key, a.stages)}
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
                    reward={q.xp}
                    claimed={!!claimed[q.key]}
                    pinned={!!pinned[q.key]}
                    onPin={() => togglePin(q.key)}
                    onClaim={() => claimQuest(q.key)}
                  />
                ))}
          </div>
        </div>
      </div>
    </main>
  );
}
