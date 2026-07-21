"use client";

import { createContext, useContext, type ReactNode } from "react";
import { useProfileShellData } from "@/hooks/use-profile-shell";
import type { PlayerProfile } from "@/lib/profile-api";
import type { SessionUser } from "@/lib/session";

type ProfileShellContextValue = {
  user: SessionUser;
  profile: PlayerProfile | null;
  profileReady: boolean;
  shell: ReturnType<typeof useProfileShellData>;
  refresh: () => Promise<PlayerProfile | null>;
};

const ProfileShellContext = createContext<ProfileShellContextValue | null>(null);

export function ProfileShellProvider({
  user,
  profile,
  profileReady,
  refresh,
  children,
}: {
  user: SessionUser;
  profile: PlayerProfile | null;
  profileReady: boolean;
  refresh: () => Promise<PlayerProfile | null>;
  children: ReactNode;
}) {
  const shell = useProfileShellData(user, profile);

  return (
    <ProfileShellContext.Provider
      value={{
        user,
        profile,
        profileReady,
        shell,
        refresh,
      }}
    >
      {children}
    </ProfileShellContext.Provider>
  );
}

export function useProfileShell() {
  const context = useContext(ProfileShellContext);
  if (!context) {
    throw new Error("useProfileShell must be used within ProfileShellProvider");
  }
  return context;
}
