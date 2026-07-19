"use client";

import Button from "@/components/ui/button";
import GradientLabel from "@/components/onboarding/gradient-label";
import type { GenderId } from "@/lib/avatars";
import { cn } from "@/lib/utils";

type OnboardingFooterProps = {
  selectedGender: GenderId;
  username: string;
  onUsernameChange: (value: string) => void;
  onSubmit: () => void;
  isLoading?: boolean;
  usernameError?: string | null;
  className?: string;
};

export default function OnboardingFooter({
  selectedGender,
  username,
  onUsernameChange,
  onSubmit,
  isLoading = false,
  usernameError,
  className,
}: OnboardingFooterProps) {
  return (
    <div
      className={cn(
        "relative flex w-[215px] flex-col items-center justify-start gap-1.5 xl:w-96 xl:gap-4",
        className,
      )}
    >
      <GradientLabel>
        <p className="text-center font-unbounded text-xs font-medium leading-7 text-mos-text xl:text-2xl">
          {selectedGender === "MALE" ? "Кто ты, воин?" : "Кто ты, воительница?"}
        </p>
      </GradientLabel>

      {usernameError ? (
        <p className="absolute top-16 rounded-lg bg-black/60 px-3 py-1.5 text-center text-xs font-medium leading-4 text-mos-danger shadow-lg backdrop-blur-sm xl:top-auto xl:bottom-8">
          {usernameError}
        </p>
      ) : null}

      <div
        className={cn(
          "flex h-8 w-full items-center overflow-hidden rounded-xl border bg-[#131525]/90 transition-colors duration-200 xl:h-[52px] xl:rounded-2xl",
          usernameError
            ? "border-mos-danger"
            : "border-transparent hover:border-mos-amber focus-within:border-mos-amber",
        )}
      >
        <input
          id="username"
          value={username}
          onChange={(event) => onUsernameChange(event.target.value)}
          placeholder="Введите никнейм"
          autoComplete="off"
          className="h-full w-full bg-transparent px-3 text-[14px] leading-5 text-mos-text outline-none placeholder:text-mos-muted xl:text-[17px] xl:leading-6"
        />
      </div>

      <Button
        type="button"
        size="lg"
        variant="primary"
        className="w-full uppercase"
        disabled={isLoading}
        onClick={onSubmit}
      >
        {isLoading
          ? "Сохраняем…"
          : selectedGender === "MALE"
            ? "Лок'тар огар!"
            : "В Каэр Морхен"}
      </Button>
    </div>
  );
}
