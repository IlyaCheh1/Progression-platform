import ProfileMiniCard from "@/components/profile-mini-card";
import TalentCard from "@/components/talents/talent-card";
import type { GenderId } from "@/lib/avatars";
import type { OgCharacterId } from "@/lib/characters";
import type { MosTalent } from "@/lib/talents-catalog";
import { cn } from "@/lib/utils";

type ActiveSkillsProps = {
  level: number;
  currentXp: number;
  xpToNext: number;
  selectedSkinId?: OgCharacterId;
  gender?: GenderId;
  skills: MosTalent[];
  onActivate: (talent: MosTalent) => Promise<void>;
  onFavourite: (talent: MosTalent) => Promise<void>;
  loading: { favorite: boolean; activate: boolean; learn: boolean };
  className?: string;
};

export default function ActiveSkills({
  level,
  currentXp,
  xpToNext,
  selectedSkinId,
  gender,
  skills,
  onActivate,
  onFavourite,
  loading,
  className,
}: ActiveSkillsProps) {
  return (
    <div
      className={cn(
        "bg-gradient-light-profile flex max-w-[220px] min-w-[200px] flex-col gap-3 rounded-[28px] p-4 backdrop-blur-md md:max-w-[300px] md:min-w-[300px] md:gap-4 md:rounded-[32px] md:p-6",
        className,
      )}
    >
      <ProfileMiniCard
        userLevel={level}
        currentXp={currentXp}
        xpToNext={xpToNext}
        selectedSkinId={selectedSkinId}
        gender={gender}
      />
      <div>
        {skills.length > 0 ? (
          <h6 className="font-display text-[10px] font-medium leading-6 text-mos-text md:text-[15px]">
            Активные умения
          </h6>
        ) : (
          <p className="text-[10px] text-mos-muted md:text-xs">Добавьте умения в избранное</p>
        )}
        <div className="mt-1 flex w-full justify-start gap-1.5 md:mt-2.5">
          {skills.map((skill) => (
            <TalentCard
              key={skill.id}
              talent={skill}
              variant="primary"
              placement="bottom-right"
              onActivate={() => onActivate(skill)}
              onFavourite={() => onFavourite(skill)}
              loading={loading}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
