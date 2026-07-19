import Progress from "@/components/ui/progress";
import ProgressCircle from "@/components/ui/progress-circle";
import type { GenderId } from "@/lib/avatars";
import type { OgCharacterId } from "@/lib/characters";

type ProfileMiniCardProps = {
  userLevel: number;
  currentXp: number;
  xpToNext: number;
  selectedSkinId?: OgCharacterId;
  gender?: GenderId;
};

export default function ProfileMiniCard({
  userLevel,
  currentXp,
  xpToNext,
  selectedSkinId,
  gender,
}: ProfileMiniCardProps) {
  const xpProgressPercent = xpToNext > 0 ? (currentXp / xpToNext) * 100 : 0;

  return (
    <div className="flex w-full items-center gap-4">
      <ProgressCircle
        progress={xpProgressPercent}
        selectedSkinId={selectedSkinId}
        gender={gender}
        size="sm"
        width={3}
        showPercentage
      />

      <div className="flex flex-1 flex-col items-end gap-3 md:gap-4">
        <div className="flex w-full items-center justify-end gap-2 md:gap-3">
          <p className="font-display text-[10px] font-medium leading-4 text-mos-text md:text-[15px] md:leading-6">
            Уровень
          </p>
          <div className="flex min-w-[32px] items-center justify-center rounded-lg bg-white/10 px-1 py-0.5 md:min-w-[42px] md:rounded-xl md:px-2">
            <p className="font-display text-[10px] font-medium leading-4 text-mos-text md:text-[15px] md:leading-6">
              {userLevel}
            </p>
          </div>
        </div>

        <Progress value={currentXp} max={xpToNext} showText suffix="XP" size="xl" />
      </div>
    </div>
  );
}
