"use client";

import AchievementShell, {
  CompletedBar,
  RewardBadge,
  type AchievementState,
} from "@/components/achievements/achievement-shell";
import Progress from "@/components/ui/progress";
import { cn } from "@/lib/utils";

export type AchievementStage = {
  id: string;
  reward: number;
  rewardKind?: "xp" | "coins";
  completed: boolean;
  claimed: boolean;
  current: number;
  target: number;
};

type StackableCardProps = {
  title: string;
  description: string;
  iconUrl?: string;
  stages: AchievementStage[];
  rewardKind?: "xp" | "coins";
  pinned: boolean;
  onClaim: () => void;
  onPin: () => void;
};

export default function StackableCard({
  title,
  description,
  iconUrl,
  stages,
  rewardKind = "xp",
  pinned,
  onClaim,
  onPin,
}: StackableCardProps) {
  const claimable = stages.filter((s) => s.completed && !s.claimed);
  const state: AchievementState =
    claimable.length > 0
      ? "claimable"
      : stages.length > 0 && stages.every((s) => s.completed && s.claimed)
        ? "completed"
        : "ongoing";

  const badgeValue =
    state === "claimable"
      ? claimable.reduce((sum, s) => sum + s.reward, 0)
      : stages.filter((s) => s.completed).sort((a, b) => b.reward - a.reward)[0]?.reward ??
        stages[0]?.reward ??
        0;

  const rows: AchievementStage[][] = [];
  for (let i = 0; i < stages.length; i += 4) rows.push(stages.slice(i, i + 4));

  return (
    <AchievementShell
      state={state}
      pinned={pinned}
      onPin={onPin}
      iconUrl={iconUrl}
      title={title}
      description={description}
      middle={
        <div className="flex flex-col gap-2">
          {rows.map((row, rowIndex) => (
            <div key={rowIndex} className="flex flex-wrap gap-2">
              {row.map((stage) => (
                <div
                  key={stage.id}
                  className={cn(
                    "bg-controlsBlur flex items-end justify-center gap-1 rounded-[20px] px-2 py-1 backdrop-blur-sm",
                    !stage.completed && "opacity-50",
                  )}
                >
                  <span className="font-display text-[10px] font-bold uppercase tracking-[0.6px] text-mos-text md:text-xs">
                    {stage.reward}
                  </span>
                  <span className="text-[9px] text-mos-amber md:text-[10px]">
                    {rewardKind === "coins" ? "монеты" : "XP"}
                  </span>
                </div>
              ))}
            </div>
          ))}
        </div>
      }
      footer={
        state === "ongoing" ? (
          <Progress
            value={stages.filter((s) => s.completed).length}
            max={stages.length || 1}
            size="achievement"
            showText
            className="w-full"
          />
        ) : state === "completed" ? (
          <CompletedBar />
        ) : null
      }
      badge={
        <RewardBadge
          value={badgeValue}
          kind={rewardKind}
          claimable={state === "claimable"}
          onClick={onClaim}
        />
      }
    />
  );
}
