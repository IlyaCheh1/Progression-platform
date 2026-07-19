import TalentCard from "@/components/talents/talent-card";
import type { MosTalent } from "@/lib/talents-catalog";
import { cn } from "@/lib/utils";

type ActiveSkillsListProps = {
  skills: MosTalent[];
  onActivate: (talent: MosTalent) => Promise<void>;
  onFavourite: (talent: MosTalent) => Promise<void>;
  loading: { favorite: boolean; activate: boolean; learn: boolean };
  compact?: boolean;
  showHeading?: boolean;
  align?: "start" | "end";
  className?: string;
};

export default function ActiveSkillsList({
  skills,
  onActivate,
  onFavourite,
  loading,
  compact = false,
  showHeading = true,
  align = "start",
  className,
}: ActiveSkillsListProps) {
  return (
    <div className={cn(align === "end" && "text-right", className)}>
      {showHeading ? (
        skills.length > 0 ? (
          <h6
            className={cn(
              "font-display font-medium text-mos-text",
              compact ? "text-[9px] leading-4" : "text-[10px] leading-6 md:text-[15px]",
            )}
          >
            Активные умения
          </h6>
        ) : (
          <p className={cn("text-mos-muted", compact ? "text-[9px] leading-4" : "text-[10px] md:text-xs")}>
            Добавьте умения в избранное
          </p>
        )
      ) : null}
      <div
        className={cn(
          "flex w-full gap-1.5",
          align === "end" ? "justify-end" : "justify-start",
          showHeading && (compact ? "mt-0.5" : "mt-1 md:mt-2.5"),
        )}
      >
        {skills.map((skill) => (
          <TalentCard
            key={skill.id}
            talent={skill}
            variant="primary"
            placement="bottom-right"
            onActivate={() => onActivate(skill)}
            onFavourite={() => onFavourite(skill)}
            loading={loading}
            className={compact ? "[&_img]:h-6 [&_img]:w-6 md:[&_img]:h-7 md:[&_img]:w-7" : undefined}
          />
        ))}
      </div>
    </div>
  );
}
