import Progress from "@/components/ui/progress";
import {
  clampMasteryRank,
  masteryRankProgress,
  masteryUnitsToPoints,
  MASTERY_MAX_RANK,
  WEAPONS,
  weaponIconUrl,
} from "@/lib/weapons";
import { cn } from "@/lib/utils";

type WeaponMasteryPanelProps = {
  mastery?: Record<string, number> | null;
  ranks?: Record<string, number> | null;
  className?: string;
};

export default function WeaponMasteryPanel({ mastery, ranks, className }: WeaponMasteryPanelProps) {
  const opened = WEAPONS.filter((w) => (ranks?.[w.key] ?? 0) > 0 || (mastery?.[w.key] ?? 0) > 0).length;

  return (
    <div
      className={cn(
        "bg-witcher-panel flex w-[200px] flex-col gap-3 rounded-2xl p-3 md:w-[300px] md:gap-4 md:rounded-[32px] md:p-6",
        className,
      )}
    >
      <div className="flex w-full items-center justify-between gap-2">
        <h3 className="font-display text-[10px] font-medium leading-4 text-mos-text md:text-[15px] md:leading-6">
          Мастерство
        </h3>
        <div className="flex min-w-[32px] items-center justify-center rounded-lg bg-white/10 px-1 py-0.5 md:min-w-[42px] md:rounded-xl md:px-2">
          <p className="font-display text-[10px] font-medium leading-4 text-mos-text md:text-[15px] md:leading-6">
            {opened}/{WEAPONS.length}
          </p>
        </div>
      </div>

      <div className="mobile-game-scroll flex max-h-[min(52vh,420px)] flex-col gap-1.5 overflow-y-auto pr-1 md:max-h-[min(58vh,520px)] md:gap-3">
        {WEAPONS.map((weapon) => {
          const units = mastery?.[weapon.key] ?? 0;
          const rank = clampMasteryRank(ranks?.[weapon.key] ?? 0);
          const points = masteryUnitsToPoints(units);
          const withinRank = masteryRankProgress(points, rank);
          return (
            <WeaponRow
              key={weapon.key}
              label={weapon.label}
              iconSrc={weaponIconUrl(weapon)}
              rank={rank}
              withinRank={withinRank}
            />
          );
        })}
      </div>
    </div>
  );
}

function WeaponRow({
  label,
  iconSrc,
  rank,
  withinRank,
}: {
  label: string;
  iconSrc: string;
  rank: number;
  withinRank: { value: number; max: number };
}) {
  const fill =
    rank >= MASTERY_MAX_RANK
      ? MASTERY_MAX_RANK
      : rank + withinRank.value / Math.max(1, withinRank.max);

  return (
    <div className="flex w-full flex-col gap-1 transition-opacity duration-200 hover:opacity-80">
      <div className="flex w-full items-center justify-between gap-2 text-[8px] leading-3 md:text-xs md:leading-4">
        <div className="flex min-w-0 items-center gap-2">
          {/* eslint-disable-next-line @next/next/no-img-element -- content icons from public/CDN */}
          <img
            src={iconSrc}
            alt=""
            width={32}
            height={32}
            className="h-6 w-6 shrink-0 rounded-full bg-mos-stone object-cover md:h-8 md:w-8"
            // Native lazy-load can stall inside overflow-hidden/auto ancestors (CharacterStage).
            loading="eager"
            decoding="async"
            aria-hidden
          />
          <p className="truncate font-normal text-mos-text">{label}</p>
        </div>
        <p className="shrink-0 whitespace-nowrap font-medium text-mos-amber">Ранг {rank}</p>
      </div>
      <div className="flex w-full items-center gap-2">
        <Progress value={fill} max={MASTERY_MAX_RANK} size="md" className="min-w-0 flex-1" />
        <div className="shrink-0 tabular-nums text-[8px] font-medium leading-3 text-mos-text md:text-xs md:leading-4">
          {rank} / {MASTERY_MAX_RANK}
        </div>
      </div>
    </div>
  );
}
