"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import CharacterCarousel from "@/components/onboarding/character-carousel";
import GenderSelector from "@/components/onboarding/gender-selector";
import OnboardingFooter from "@/components/onboarding/onboarding-footer";
import { useOnboardingCharacters } from "@/hooks/use-onboarding-characters";
import { fetchMyProfile, messageForProfileError, ProfileApiError, saveMyProfile } from "@/lib/profile-api";
import { clearSession, loadSession, patchSession } from "@/lib/session";
import { DEFAULT_BACKGROUND_ID, onboardingBackgroundPath } from "@/lib/backgrounds";

const USERNAME_REGEX = /^[a-zA-Z0-9_-]{6,30}$/;

export default function OnboardingPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [usernameError, setUsernameError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const {
    selectedGender,
    setSelectedGender,
    filteredCharacters,
    characterPositions,
    getCenterCharacterId,
    handleCharacterClick,
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

  function handleUsernameChange(value: string) {
    setUsername(value);
    if (usernameError) setUsernameError(null);
  }

  async function handleWarriorSubmit() {
    setUsernameError(null);
    const session = loadSession();
    if (!session) {
      router.replace("/login");
      return;
    }

    const trimmed = username.trim();
    if (!trimmed) {
      setUsernameError("Имя пользователя не может быть пустым");
      return;
    }

    if (!USERNAME_REGEX.test(trimmed)) {
      if (trimmed.length < 6) {
        setUsernameError("Имя пользователя должно содержать минимум 6 символов");
      } else if (trimmed.length > 30) {
        setUsernameError("Имя пользователя должно содержать максимум 30 символов");
      } else {
        setUsernameError(
          "Имя пользователя может содержать только латинские буквы, цифры, подчеркивание и дефис",
        );
      }
      return;
    }

    setSubmitting(true);
    try {
      const profile = await saveMyProfile(session, {
        username: trimmed,
        selectedSkinId: getCenterCharacterId(),
        gender: selectedGender,
        backgroundKey: DEFAULT_BACKGROUND_ID,
        profileComplete: true,
      });
      patchSession({ profileComplete: profile.profileComplete, name: profile.username });
      router.push("/profile");
    } catch (error) {
      if (error instanceof ProfileApiError && error.isUnauthorized) {
        clearSession();
        setUsernameError(messageForProfileError(error));
        router.replace("/login");
        return;
      }
      setUsernameError(messageForProfileError(error));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main
      className="relative flex h-full min-h-lvh flex-1 flex-col bg-cover bg-bottom xl:bg-center"
      style={{ backgroundImage: `url(${onboardingBackgroundPath()})` }}
    >
      <GenderSelector
        className="z-10 mt-4 xl:mt-[42px]"
        value={selectedGender}
        onChange={setSelectedGender}
      />

      <CharacterCarousel
        key={selectedGender}
        className="z-10 h-full flex-1 xl:mt-4"
        characters={filteredCharacters}
        characterPositions={characterPositions}
        onCharacterClick={handleCharacterClick}
        getCenterCharacterId={getCenterCharacterId}
      />

      <OnboardingFooter
        className="z-20 mx-auto mb-4 xl:mb-[60px]"
        selectedGender={selectedGender}
        username={username}
        onUsernameChange={handleUsernameChange}
        onSubmit={handleWarriorSubmit}
        isLoading={submitting}
        usernameError={usernameError}
      />
    </main>
  );
}
