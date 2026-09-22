"use client";

import { useSearchParams } from "next/navigation";

import { ONLYID_ERROR_MESSAGES } from "@/lib/auth/registration-invites";

export function CabinetLogin() {
  const searchParams = useSearchParams();
  const code = searchParams.get("login_error");
  const error = code ? ONLYID_ERROR_MESSAGES[code] || "Ошибка входа. Попробуйте снова." : "";
  const returnUrl = searchParams.get("returnUrl");
  const onlyIdHref = returnUrl
    ? `/api/auth/login?returnUrl=${encodeURIComponent(returnUrl)}`
    : "/api/auth/login";

  return (
    <div className="auth-panel">
      <h1>Личный кабинет</h1>
      <p className="auth-lead">Вход в кабинет «Мастер меча» через OnlyID.</p>
      <a className="og-btn og-btn-primary auth-onlyid" href={onlyIdHref}>
        Войти через OnlyID
      </a>
      {error && <p className="auth-error">{error}</p>}
    </div>
  );
}
