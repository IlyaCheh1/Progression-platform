"use client";

import SingleCard from "@/components/achievements/single-card";

type TaskCardProps = {
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

/** Quest card — same shell as SingleCard (OG TaskCard anatomy). */
export default function TaskCard(props: TaskCardProps) {
  return <SingleCard {...props} />;
}
