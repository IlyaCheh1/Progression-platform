"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { fetchMyProfile, migrateLocalProfileToBackend } from "@/lib/profile-api";
import { hasProfile, homePathForRoles, saveSession, type SessionUser } from "@/lib/session";

export default function AuthCallbackPage() {
  const router = useRouter();

  useEffect(() => {
    let cancelled = false;

    async function finishAuth() {
      const session: SessionUser = {
        studentId: "student-oauth-demo",
        name: "OnlyID Guest",
        login: "oauth@masterofsword.local",
        characterId: "char-oauth-demo",
        accessToken: "demo-oauth",
        role: "student",
        roles: ["student"],
      };
      saveSession(session);

      try {
        const profile = (await fetchMyProfile(session)) ?? (await migrateLocalProfileToBackend(session));
        if (profile?.profileComplete) {
          session.profileComplete = true;
          saveSession(session);
        }
      } catch {
        // Demo OAuth token may not reach school-api; fall back to local profile state.
      }

      if (cancelled) return;
      router.replace(homePathForRoles(session.roles, hasProfile(session)));
    }

    void finishAuth();
    return () => {
      cancelled = true;
    };
  }, [router]);

  return <main className="grid min-h-screen place-items-center text-mos-muted">Завершаем вход…</main>;
}
