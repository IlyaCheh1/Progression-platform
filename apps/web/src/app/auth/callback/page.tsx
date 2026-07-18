"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { hasProfile, saveSession } from "@/lib/session";

export default function AuthCallbackPage() {
  const router = useRouter();
  useEffect(() => {
    saveSession({
      studentId: "student-oauth-demo",
      name: "OnlyID Guest",
      login: "oauth@masterofsword.local",
      characterId: "char-oauth-demo",
      accessToken: "demo-oauth",
      role: "student",
    });
    router.replace(hasProfile() ? "/profile" : "/onboarding");
  }, [router]);
  return <main className="grid min-h-screen place-items-center text-mos-muted">Завершаем вход…</main>;
}
