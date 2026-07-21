"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import LandscapeLock from "@/components/landscape-lock";
import ProfileHeader from "@/components/profile-header";
import { TalentsProvider } from "@/components/talents/talents-provider";
import SupportChatRoot from "@/components/support-chat-root";
import { useProfileShellData } from "@/hooks/use-profile-shell";
import { usePlayerProfile } from "@/hooks/use-player-profile";
import { hasProfile, loadSession, SESSION_CHANGED_EVENT, type SessionUser } from "@/lib/session";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<SessionUser | null>(null);
  const { profile, loading: profileLoading, profileReady } = usePlayerProfile(user);
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

  if (!user || profileLoading) {
    return <main className="grid min-h-screen place-items-center text-mos-muted">Загрузка…</main>;
  }

  if (!profileReady && !hasProfile(user)) {
    return <main className="grid min-h-screen place-items-center text-mos-muted">Перенаправляем…</main>;
  }

  return (
    <TalentsProvider>
      <LandscapeLock />
      <div className="flex h-dvh max-h-dvh flex-col overflow-hidden bg-mos-bg">
        <div className="sticky top-0 z-40 shrink-0">
          <ProfileHeader user={user} {...shell} />
        </div>
        <div className="min-h-0 flex-1 overflow-x-hidden overflow-y-auto">{children}</div>
        <SupportChatRoot />
      </div>
    </TalentsProvider>
  );
}
