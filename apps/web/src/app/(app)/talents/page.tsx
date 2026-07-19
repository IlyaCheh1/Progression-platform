"use client";

import GradientLabel from "@/components/onboarding/gradient-label";
import ActiveSkills from "@/components/talents/active-skills";
import SkillPoints from "@/components/talents/skill-points";
import SkillThree from "@/components/talents/skill-three";
import { useAvatarPresentation } from "@/components/character-avatar";
import { usePlayerProfile } from "@/hooks/use-player-profile";
import { useTalents } from "@/hooks/use-talents";
import { TREE_GRADIENT, TREE_LABEL_CLASS } from "@/lib/talents-catalog";
import { loadSession } from "@/lib/session";
import { cn } from "@/lib/utils";

export default function TalentsPage() {
  const user = typeof window !== "undefined" ? loadSession() : null;
  const { profile } = usePlayerProfile(user);
  const presentation = useAvatarPresentation(profile ?? undefined);
  const {
    trees,
    points,
    favoriteSkills,
    loading,
    error,
    onLearn,
    handleActivate,
    handleFavourite,
    clearError,
  } = useTalents();

  return (
    <div
      className="relative flex min-h-[calc(100vh-72px)] flex-1 flex-col overflow-x-hidden bg-cover bg-center bg-no-repeat pb-8 md:pb-12 md:pt-6"
      style={{
        backgroundImage: "url(/media/ui/talent-background.png)",
        backgroundSize: "80%",
      }}
    >
      <div className="absolute left-0 top-3 z-10 flex w-full items-start justify-center gap-3 px-3 md:top-6 md:justify-between md:px-6">
        <ActiveSkills
          level={profile?.level ?? 1}
          currentXp={profile?.xp ?? 0}
          xpToNext={profile?.xpToNextLevel ?? 500}
          selectedSkinId={presentation.selectedSkinId}
          gender={presentation.gender}
          skills={favoriteSkills}
          onActivate={handleActivate}
          onFavourite={handleFavourite}
          loading={loading}
          className="hidden md:flex"
        />
        <SkillPoints skillPoints={points} />
      </div>

      {error ? (
        <div className="absolute left-1/2 top-20 z-20 -translate-x-1/2 rounded-xl border border-mos-danger/40 bg-mos-stone/95 px-4 py-2 text-sm text-mos-danger shadow-xl">
          <button type="button" className="mr-2 text-mos-muted" onClick={clearError}>
            ×
          </button>
          {error}
        </div>
      ) : null}

      <div className="relative z-0 mx-auto mt-16 flex w-full max-w-[1600px] flex-1 flex-row items-stretch justify-around gap-0 overflow-x-auto px-2 md:mt-[220px] md:gap-4 md:px-4">
        {trees.map((tree) => (
          <div
            key={tree.name}
            className="relative flex min-w-[180px] flex-1 flex-col items-center justify-end gap-2 md:min-w-0 md:gap-5"
          >
            <SkillThree
              {...tree}
              availablePoints={points}
              onLearn={onLearn}
              onActivate={handleActivate}
              onFavourite={handleFavourite}
              loading={loading}
            />
            <GradientLabel color={TREE_GRADIENT[tree.type]} className="max-w-[172px]">
              <h5
                className={cn(
                  "font-display text-[10px] font-medium leading-3 md:text-[17px] md:leading-6",
                  TREE_LABEL_CLASS[tree.type],
                )}
              >
                {tree.name}
              </h5>
            </GradientLabel>
          </div>
        ))}
      </div>
    </div>
  );
}
