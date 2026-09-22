"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import { ONLYID_ERROR_MESSAGES } from "@/lib/auth/registration-invites";

type InviteView = {
  displayName: string;
  login: string;
};

export function RegistrationScreen({ token, registerError }: { token: string; registerError: string }) {
  const [state, setState] = useState<"loading" | "ready" | "invalid">("loading");
  const [invite, setInvite] = useState<InviteView | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await fetch(`/api/auth/registration/${encodeURIComponent(token)}`, { cache: "no-store" });
        if (!res.ok) {
          if (!cancelled) setState("invalid");
          return;
        }
        const data = (await res.json()) as InviteView;
        if (!cancelled) {
          setInvite(data);
          setState("ready");
        }
      } catch {
        if (!cancelled) setState("invalid");
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [token]);

  const errorText = registerError
    ? ONLYID_ERROR_MESSAGES[registerError] || "Не удалось продолжить регистрацию."
    : "";

  return (
    <div className="auth-panel">
      <h1>Регистрация</h1>
      <p className="auth-lead">
        Ссылка администратора открывает кабинет «Мастер меча». Это отдельная страница, не вход.
      </p>
      {state === "loading" && <p className="auth-note">Проверяем ссылку…</p>}
      {state === "invalid" && (
        <p className="auth-error">Эта ссылка недействительна. Попросите администратора отправить новую.</p>
      )}
      {state === "ready" && invite && (
        <>
          <div className="auth-account">
            <strong>{invite.displayName}</strong>
            <span>{invite.login}</span>
          </div>
          <a className="og-btn og-btn-primary auth-onlyid" href={`/api/auth/login?invite=${encodeURIComponent(token)}`}>
            Зарегистрироваться через OnlyID
          </a>
        </>
      )}
      {errorText && <p className="auth-error">{errorText}</p>}
      <Link className="auth-text-link" href="/login">
        Уже есть кабинет — войти
      </Link>
    </div>
  );
}
