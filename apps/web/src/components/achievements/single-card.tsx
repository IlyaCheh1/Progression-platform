"use client";

import AchievementShell, {
  CompletedBar,
  RewardBadge,
  type AchievementState,
} from "@/components/achievements/achievement-shell";
import Progress from "@/components/ui/progress";

type SingleCardProps = {
  title: string;
  description: string;
  iconUrl?: string;
  current: number;
  target: number;
  reward: number;
  claimed?: boolean;
  pinned: boolean;
  onClaim: () => void;
  onPin: () => void;
};

export default function SingleCard({
  title,
  description,
  iconUrl,
  current,
  target,
  reward,
  claimed = false,
  pinned,
  onClaim,
  onPin,
}: SingleCardProps) {
  const state: AchievementState = claimed
    ? "completed"
    : current >= target
      ? "claimable"
      : "ongoing";

  return (
    <AchievementShell
      state={state}
      pinned={pinned}
      onPin={onPin}
      iconUrl={iconUrl}
      title={title}
      description={description}
      footer={
        state === "ongoing" ? (
          <Progress value={current} max={target} size="achievement" showText className="w-full" />
        ) : state === "completed" ? (
          <CompletedBar />
        ) : null
      }
      badge={<RewardBadge value={reward} claimable={state === "claimable"} onClick={onClaim} />}
    />
  );
}
