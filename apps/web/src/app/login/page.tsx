"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { SCHOOL_API, AUTH_URL } from "@/lib/utils";
import { hasProfile, saveSession } from "@/lib/session";
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();
  const [login, setLogin] = useState("demo.maks-kiselev@masterofsword.local");
  const [password, setPassword] = useState("MoS-Demo-MaksKiselev-2026!");
  const [error, setError] = useState("");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    try {
      const res = await fetch(`${SCHOOL_API}/v1/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ login, password }),
      });
      if (!res.ok) {
        setError("Неверный логин или пароль. Запустите school-api и seed.");
        return;
      }
      const data = await res.json();
      saveSession({
        studentId: data.student.id,
        name: data.student.displayName ?? data.student.DisplayName,
        login,
        characterId: data.student.characterId ?? data.student.CharacterID,
        accessToken: data.accessToken,
      });
      router.push(hasProfile() ? "/profile" : "/onboarding");
    } catch {
      setError("API недоступен. Поднимите school-api на :8082");
    }
  }

  function onlyId() {
    window.location.href = `${AUTH_URL}/oauth/authorize?redirect_uri=${encodeURIComponent(window.location.origin + "/auth/callback")}`;
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-4">
      <Link href="/" className="mb-8 font-display tracking-[0.2em] text-mos-amber">
        MASTER OF SWORD
      </Link>
      <h1 className="font-display text-3xl text-mos-text">Вход</h1>
      <p className="mt-2 text-sm text-mos-muted">Demo login из Excel-сида или OnlyID sandbox.</p>
      <form onSubmit={onSubmit} className="mt-8 space-y-4">
        <label className="block text-xs uppercase tracking-widest text-mos-muted">
          Логин
          <input className="mt-1 w-full border border-mos-line bg-mos-stone px-3 py-2 text-mos-text" value={login} onChange={(e) => setLogin(e.target.value)} />
        </label>
        <label className="block text-xs uppercase tracking-widest text-mos-muted">
          Пароль
          <input type="password" className="mt-1 w-full border border-mos-line bg-mos-stone px-3 py-2 text-mos-text" value={password} onChange={(e) => setPassword(e.target.value)} />
        </label>
        {error && <p className="text-sm text-[#c45c2a]">{error}</p>}
        <button type="submit" className="mos-btn w-full">
          Войти
        </button>
      </form>
      <button type="button" onClick={onlyId} className="mos-btn mt-3 w-full border-mos-line text-mos-text">
        OnlyID
      </button>
      <p className="mt-6 text-xs text-mos-muted">
        Аккаунты: <code>docs/demo-accounts.md</code>
      </p>
    </main>
  );
}
