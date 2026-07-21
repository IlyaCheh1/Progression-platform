"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ProfileShellProvider } from "@/components/profile-shell-provider";
import ProfileHeader from "@/components/profile-header";
import RotateProposal from "@/components/rotate-proposal";
import { TalentsProvider } from "@/components/talents/talents-provider";
import SupportChatRoot from "@/components/support-chat-root";
import { useDevice } from "@/hooks/use-device";
import { usePlayerProfile } from "@/hooks/use-player-profile";
import { useProfileShellData } from "@/hooks/use-profile-shell";
import { hasProfile, loadSession, SESSION_CHANGED_EVENT, type SessionUser } from "@/lib/session";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { shouldRotate } = useDevice();
  const [user, setUser] = useState<SessionUser | null>(null);
  const { profile, loading: profileLoading, profileReady, refresh } = usePlayerProfile(user);
  const shell = useProfileShellData(user, profile);

  useEffect(() => {
    function syncSession() {
      const session = loadSession();
      if (!session) {
        router.replace("/login");
        return;
      }
      setUser(session);
    }

    syncSession();
    window.addEventListener(SESSION_CHANGED_EVENT, syncSession);
    return () => window.removeEventListener(SESSION_CHANGED_EVENT, syncSession);
  }, [router]);

  useEffect(() => {
    if (!user || profileLoading) return;
    if (!profileReady && !hasProfile(user)) {
      router.replace("/onboarding");
    }
  }, [user, profileLoading, profileReady, router]);

  if (shouldRotate) {
    return <RotateProposal />;
  }

  if (!user || profileLoading) {
    return <main className="grid min-h-lvh place-items-center text-mos-muted">Загрузка…</main>;
  }

  if (!profileReady && !hasProfile(user)) {
    return <main className="grid min-h-lvh place-items-center text-mos-muted">Перенаправляем…</main>;
  }

  return (
    <ProfileShellProvider user={user} profile={profile} profileReady={profileReady} refresh={refresh}>
      <TalentsProvider>
        <div className="flex min-h-lvh w-full flex-col bg-mos-bg">
          <ProfileHeader user={user} {...shell} />
          <div className="flex min-h-0 flex-1 flex-col overflow-x-hidden overflow-y-auto">{children}</div>
          <SupportChatRoot />
        </div>
      </TalentsProvider>
    </ProfileShellProvider>
  );
}
