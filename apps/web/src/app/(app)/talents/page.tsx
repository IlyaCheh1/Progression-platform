"use client";

import GradientLabel from "@/components/onboarding/gradient-label";
import ActiveSkills from "@/components/talents/active-skills";
import SkillThree from "@/components/talents/skill-three";
import { useTalents } from "@/components/talents/talents-provider";
import { TREE_GRADIENT, TREE_LABEL_CLASS } from "@/lib/talents-catalog";
import { cn } from "@/lib/utils";

export default function TalentsPage() {
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
    <div className="relative flex min-h-[calc(100vh-72px)] flex-1 flex-col overflow-x-hidden pb-8 md:pb-12">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: "url(/media/ui/talent-background.webp)",
        }}
      />
      <div aria-hidden className="pointer-events-none absolute inset-0 bg-black/65" />
      <div className="absolute left-0 top-3 z-10 flex w-full items-start justify-start gap-3 px-3 md:top-6 md:px-6">
        <ActiveSkills
          skillPoints={points}
          skills={favoriteSkills}
          onActivate={handleActivate}
          onFavourite={handleFavourite}
          loading={loading}
          className="hidden md:flex"
        />
      </div>

      {error ? (
        <div className="absolute left-1/2 top-20 z-20 -translate-x-1/2 rounded-xl border border-mos-danger/40 bg-mos-stone/95 px-4 py-2 text-sm text-mos-danger shadow-xl">
          <button type="button" className="mr-2 text-mos-muted" onClick={clearError}>
            ×
          </button>
          {error}
        </div>
      ) : null}

      <div className="relative z-0 flex flex-1 items-center justify-center overflow-x-auto px-2 md:px-4">
        <div className="mx-auto flex w-full max-w-[1600px] flex-row items-end justify-center gap-2 md:gap-8">
          {trees.map((tree) => (
            <div
              key={tree.name}
              className="relative flex min-w-[180px] flex-col items-center justify-end gap-2 md:min-w-0 md:gap-5"
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
    </div>
  );
}
