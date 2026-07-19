"use client";

import type { ReactNode } from "react";
import PopupMenu from "@/components/ui/popup-menu";
import type { MosTalent } from "@/lib/talents-catalog";

type Props = {
  talent: MosTalent;
  children: ReactNode;
  onLearn?: () => void;
  canBeLearned?: boolean;
  loading?: { learn?: boolean };
  placement?: "bottom" | "bottom-left" | "bottom-right";
};

export default function PassiveTalentPopup({
  talent,
  children,
  onLearn,
  canBeLearned = true,
  loading,
  placement = "bottom",
}: Props) {
  const isLearned = talent.isLearned;

  return (
    <PopupMenu trigger={children} placement={placement} margin={10} hover>
      <div className="flex w-fit max-w-[250px] flex-col gap-4 rounded-2xl bg-mos-stone p-3 backdrop-blur-md md:rounded-[20px] md:p-4">
        <div className="flex flex-col gap-2">
          <div className="flex h-5 w-fit items-center rounded-md bg-white/10 px-1">
            <span className="font-golos text-[10px] font-medium md:text-xs">
              {!isLearned ? (
                <span className="text-mos-muted">Недоступно</span>
              ) : (
                <span className="text-cyan-300">Пассивное умение</span>
              )}
            </span>
          </div>
          <h3 className="font-display text-[10px] font-medium text-mos-text md:text-[15px] md:leading-6">
            {talent.name}
          </h3>
          <p className="font-golos text-[10px] text-mos-text md:text-sm md:leading-5">{talent.description}</p>

          <div className="my-1 h-px bg-white/10" />

          {isLearned ? (
            <div className="flex flex-col gap-2">
              <span className="font-golos text-[10px] text-mos-muted md:text-sm">Текущий уровень:</span>
              <div className="flex flex-col flex-wrap gap-1">
                {Object.entries(talent.effects).map(([key, value]) => (
                  <p
                    key={key}
                    className="bg-controlsBlur w-fit rounded-[20px] px-2 py-1 text-center text-xs font-medium text-[#7dba5a]"
                  >
                    {key}: {value}
                  </p>
                ))}
              </div>
            </div>
          ) : null}

          {!isLearned && canBeLearned ? (
            <button
              type="button"
              disabled={loading?.learn}
              onClick={onLearn}
              className="og-btn og-btn-secondary og-btn-sm w-full uppercase"
            >
              изучить
            </button>
          ) : null}
        </div>
      </div>
    </PopupMenu>
  );
}
