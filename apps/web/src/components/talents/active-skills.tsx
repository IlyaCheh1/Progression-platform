import ActiveSkillsList from "@/components/talents/active-skills-list";
import type { MosTalent } from "@/lib/talents-catalog";
import { cn } from "@/lib/utils";

type ActiveSkillsProps = {
  skillPoints: number;
  skills: MosTalent[];
  onActivate: (talent: MosTalent) => Promise<void>;
  onFavourite: (talent: MosTalent) => Promise<void>;
  loading: { favorite: boolean; activate: boolean; learn: boolean };
  className?: string;
};

export default function ActiveSkills({
  skillPoints,
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
      <div className="flex items-center justify-between gap-2">
        <p className="font-display text-[10px] font-medium leading-6 text-mos-text md:text-[15px]">
          Доступно умений
        </p>
        <div className="flex min-w-[32px] items-center justify-center rounded-lg bg-white/10 px-1 py-0.5 md:min-w-[42px] md:rounded-xl md:px-2">
          <p className="font-display text-[10px] font-medium text-mos-text md:text-[15px] md:leading-6">
            {skillPoints}
          </p>
        </div>
      </div>
      <ActiveSkillsList
        skills={skills}
        onActivate={onActivate}
        onFavourite={onFavourite}
        loading={loading}
      />
    </div>
  );
}
