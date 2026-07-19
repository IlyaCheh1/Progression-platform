"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import CharacterCarousel from "@/components/onboarding/character-carousel";
import { useOnboardingCharacters } from "@/hooks/use-onboarding-characters";
import { fetchMyProfile, saveMyProfile } from "@/lib/profile-api";
import { loadSession, patchSession } from "@/lib/session";
import {
  DEFAULT_BACKGROUND_ID,
  onboardingBackgroundPath,
  selectableOnboardingBackgrounds,
  type BackgroundId,
} from "@/lib/backgrounds";
import { schoolApiUnavailableMessage } from "@/lib/utils";
import { cn } from "@/lib/utils";

export default function OnboardingPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [username, setUsername] = useState("");
  const [backgroundKey, setBackgroundKey] = useState<BackgroundId>(DEFAULT_BACKGROUND_ID);
  const backgrounds = selectableOnboardingBackgrounds();

  const {
    selectedGender,
    setSelectedGender,
    filteredCharacters,
    characterPositions,
    getCenterCharacterId,
    handleCharacterClick,
    centerCharacter,
  } = useOnboardingCharacters("MALE");

  useEffect(() => {
    const session = loadSession();
    if (!session) {
      router.replace("/login");
      return;
    }

    void fetchMyProfile(session).then((profile) => {
      if (profile?.profileComplete) {
        patchSession({ profileComplete: true });
        router.replace("/profile");
      }
    });
  }, [router]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const session = loadSession();
    if (!session) {
      router.replace("/login");
      return;
    }

    const trimmed = username.trim();
    if (!trimmed) {
      setError("Имя персонажа не может быть пустым");
      return;
    }

    setSubmitting(true);
    try {
      const profile = await saveMyProfile(session, {
        username: trimmed,
        selectedSkinId: getCenterCharacterId(),
        gender: selectedGender,
        backgroundKey,
        profileComplete: true,
      });
      patchSession({ profileComplete: profile.profileComplete, name: profile.username });
      router.push("/profile");
    } catch {
      setError(schoolApiUnavailableMessage());
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main
      className="relative flex min-h-screen flex-col bg-cover bg-bottom md:bg-center"
      style={{ backgroundImage: `url(${onboardingBackgroundPath()})` }}
    >
      <div className="absolute inset-0 bg-black/50" />

      <div className="relative z-10 flex min-h-screen flex-col">
        <div className="mx-auto mt-4 flex gap-2 md:mt-8">
          {(["MALE", "FEMALE"] as const).map((gender) => (
            <button
              key={gender}
              type="button"
              className={cn(
                "border px-4 py-2 text-xs uppercase tracking-widest transition-colors",
                selectedGender === gender
                  ? "border-mos-amber bg-mos-amber/15 text-mos-amber"
                  : "border-mos-line/50 bg-mos-bg/60 text-mos-muted hover:text-mos-text",
              )}
              onClick={() => setSelectedGender(gender)}
            >
              {gender === "MALE" ? "Мужской" : "Женский"}
            </button>
          ))}
        </div>

        <CharacterCarousel
          className="flex-1 px-2 pt-4 md:px-6"
          characters={filteredCharacters}
          characterPositions={characterPositions}
          onCharacterClick={handleCharacterClick}
          centerCharacter={centerCharacter}
        />

        <form
          onSubmit={submit}
          className="relative z-20 mx-auto mb-6 w-full max-w-3xl space-y-4 px-4 md:mb-12"
        >
          <label className="block text-xs uppercase tracking-widest text-mos-muted">
            Имя персонажа
            <input
              className="mt-1 w-full border border-mos-line bg-mos-stone/90 px-3 py-2 text-mos-text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </label>

          <fieldset className="space-y-2">
            <legend className="text-xs uppercase tracking-widest text-mos-muted">Фон профиля</legend>
            <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
              {backgrounds.map((bg) => (
                <button
                  key={bg.id}
                  type="button"
                  className={cn(
                    "overflow-hidden border bg-mos-bg/80 text-left",
                    backgroundKey === bg.id ? "border-mos-amber" : "border-mos-line/50",
                  )}
                  onClick={() => setBackgroundKey(bg.id)}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={bg.src} alt={bg.label} className="h-16 w-full object-cover md:h-20" />
                  <p className="px-2 py-1 text-[10px] text-mos-text">{bg.label}</p>
                </button>
              ))}
            </div>
          </fieldset>

          {error && <p className="text-sm text-[#c45c2a]">{error}</p>}

          <button type="submit" className="mos-btn w-full" disabled={submitting}>
            {submitting ? "Сохраняем…" : "Создать профиль"}
          </button>
        </form>
      </div>
    </main>
  );
}
