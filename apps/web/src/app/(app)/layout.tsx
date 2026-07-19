"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import ProfileHeader from "@/components/profile-header";
import SupportChatRoot from "@/components/support-chat-root";
import { useProfileShellData } from "@/hooks/use-profile-shell";
import { usePlayerProfile } from "@/hooks/use-player-profile";
import { hasProfile, loadSession, type SessionUser } from "@/lib/session";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<SessionUser | null>(null);
  const { profile, loading: profileLoading, profileReady } = usePlayerProfile(user);
  const shell = useProfileShellData(user, profile);

  useEffect(() => {
    const session = loadSession();
    if (!session) {
      router.replace("/login");
      return;
    }
    setUser(session);
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
    <div className="min-h-screen bg-mos-bg">
      <ProfileHeader user={user} {...shell} />
      {children}
      <SupportChatRoot />
    </div>
  );
}
