"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/**
 * OnlyID OAuth ещё не выдаёт токен school-api.
 * Фейковая demo-сессия ломала onboarding (401 на PUT /v1/profile/me).
 */
export default function AuthCallbackPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/login");
  }, [router]);

  return <main className="grid min-h-screen place-items-center text-mos-muted">Перенаправляем на вход…</main>;
}
