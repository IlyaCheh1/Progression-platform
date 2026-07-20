"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { writeCachedProfile } from "@/lib/profile-api";
import {
  hasProfile,
  homePathForRoles,
  saveSession,
  type SessionUser,
} from "@/lib/session";
import { normalizeGender } from "@/lib/avatars";
import { DEFAULT_BACKGROUND_ID, normalizeBackgroundId } from "@/lib/backgrounds";
import { normalizeSelectedSkinId } from "@/lib/characters";
import { SCHOOL_API } from "@/lib/utils";

const ERROR_MESSAGES: Record<string, string> = {
  no_bridge_session: "Сессия OnlyID не найдена. Войдите снова.",
  sso_not_configured: "Вход через OnlyID не настроен.",
};

function AuthCallbackInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [message, setMessage] = useState("Завершаем вход через OnlyID…");

  useEffect(() => {
    let cancelled = false;

    async function hydrate() {
      try {
        const res = await fetch("/api/auth/session-bridge", { cache: "no-store" });
        if (!res.ok) {
          const body = (await res.json().catch(() => ({}))) as { error?: string };
          const code = body.error || "no_bridge_session";
          if (!cancelled) {
            setMessage(ERROR_MESSAGES[code] || "Не удалось завершить вход.");
          }
          router.replace(`/login?login_error=${encodeURIComponent(code)}`);
          return;
        }

        const data = (await res.json()) as { session: SessionUser };
        const session = data.session;
        if (!session?.accessToken || !session.studentId) {
          router.replace("/login?login_error=no_bridge_session");
          return;
        }

        saveSession(session);

        try {
          const profileRes = await fetch(`${SCHOOL_API}/v1/profile/me`, {
            headers: { Authorization: `Bearer ${session.accessToken}` },
          });
          if (profileRes.ok) {
            const profile = (await profileRes.json()) as Record<string, unknown>;
            const gender = normalizeGender(String(profile.gender ?? "MALE"));
            writeCachedProfile({
              studentId: session.studentId,
              characterId: session.characterId,
              displayName: session.name,
              profileComplete: Boolean(profile.profileComplete),
              username: String(profile.username ?? session.name),
              selectedSkinId: normalizeSelectedSkinId(String(profile.selectedSkinId ?? ""), gender),
              gender,
              backgroundKey: normalizeBackgroundId(String(profile.backgroundKey ?? DEFAULT_BACKGROUND_ID)),
              avatarUrl: String(profile.avatarUrl ?? ""),
              level: Number(profile.level ?? 1),
              xp: Number(profile.xp ?? 0),
              xpToNextLevel: Number(profile.xpToNextLevel ?? 500),
              mastery: (profile.mastery as Record<string, number>) ?? {},
              ranks: (profile.ranks as Record<string, number>) ?? {},
            });
            if (profile.profileComplete) {
              session.profileComplete = true;
              saveSession(session);
            }
          }
        } catch {
          // Profile cache is optional; cabinet will refetch.
        }

        const next = searchParams.get("next");
        const safeNext =
          next &&
          next.startsWith("/") &&
          !next.startsWith("//") &&
          !next.startsWith("/\\") &&
          !next.includes("\\") &&
          !next.includes("@")
            ? next
            : null;
        const target = safeNext || homePathForRoles(session.roles, hasProfile(session));
        if (!cancelled) {
          router.replace(target);
        }
      } catch {
        if (!cancelled) {
          router.replace("/login?login_error=sso_error");
        }
      }
    }

    void hydrate();
    return () => {
      cancelled = true;
    };
  }, [router, searchParams]);

  return <main className="grid min-h-screen place-items-center text-mos-muted">{message}</main>;
}

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={<main className="grid min-h-screen place-items-center text-mos-muted">Завершаем вход…</main>}>
      <AuthCallbackInner />
    </Suspense>
  );
}
