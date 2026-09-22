"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { SCHOOL_API, schoolApiUnavailableMessage } from "@/lib/utils";
import {
  hasProfile,
  homePathForRoles,
  normalizeRoles,
  parseExpiresAt,
  primaryRole,
  saveSession,
} from "@/lib/session";
import { writeCachedProfile } from "@/lib/profile-api";
import { normalizeGender } from "@/lib/avatars";
import { DEFAULT_BACKGROUND_ID, normalizeBackgroundId } from "@/lib/backgrounds";
import { normalizeSelectedSkinId } from "@/lib/characters";
import { ONLYID_ERROR_MESSAGES } from "@/lib/auth/registration-invites";

function readLoginRoles(data: Record<string, unknown>): ReturnType<typeof normalizeRoles> {
  const student = (data.student ?? {}) as Record<string, unknown>;
  return normalizeRoles(data.roles ?? student.roles ?? data.role ?? student.role ?? student.Role);
}

function PasswordToggleIcon({ visible }: { visible: boolean }) {
  if (visible) {
    return (
      <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden fill="none" stroke="currentColor" strokeWidth="1.75">
        <path
          d="M3 3l18 18M10.58 10.58A2 2 0 0012 14a2 2 0 001.41-3.41M9.88 4.24A10.94 10.94 0 0112 5c5 0 9.27 3.11 11 7-1.02 2.28-2.78 4.18-5 5.32M6.11 6.11C3.6 7.62 1.73 10.05 1 13c1.73 3.89 6 7 11 7 1.05 0 2.06-.14 3-.4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }

  return (
    <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden fill="none" stroke="currentColor" strokeWidth="1.75">
      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

export function CabinetLogin() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [login, setLogin] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState(() => {
    const code = searchParams.get("login_error");
    return code ? ONLYID_ERROR_MESSAGES[code] || "Ошибка входа. Попробуйте снова." : "";
  });

  const returnUrl = searchParams.get("returnUrl");
  const onlyIdHref = returnUrl
    ? `/api/auth/login?returnUrl=${encodeURIComponent(returnUrl)}`
    : "/api/auth/login";

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
      const student = (data.student ?? {}) as Record<string, unknown>;
      const roles = readLoginRoles(data as Record<string, unknown>);
      const role = primaryRole(roles);
      const profileComplete = Boolean(student.profileComplete);
      const session = {
        studentId: String(student.id ?? ""),
        name: String(student.displayName ?? student.DisplayName ?? ""),
        login,
        characterId: String(student.characterId ?? student.CharacterID ?? ""),
        accessToken: String(data.accessToken ?? ""),
        role,
        roles,
        profileComplete,
        expiresAt: parseExpiresAt(data.expiresAt),
      };
      saveSession(session);
      const gender = normalizeGender(String(student.gender ?? "MALE"));
      if (profileComplete) {
        writeCachedProfile({
          studentId: session.studentId,
          characterId: session.characterId,
          displayName: session.name,
          profileComplete: true,
          username: String(student.profileUsername ?? student.displayName ?? session.name),
          selectedSkinId: normalizeSelectedSkinId(
            String(student.selectedSkinId ?? student.skin ?? ""),
            gender,
          ),
          gender,
          backgroundKey: normalizeBackgroundId(String(student.backgroundKey ?? DEFAULT_BACKGROUND_ID)),
          avatarUrl: String(student.avatarUrl ?? ""),
          level: 1,
          xp: 0,
          xpToNextLevel: 500,
          mastery: (student.mastery as Record<string, number>) ?? {},
          ranks: (student.ranks as Record<string, number>) ?? {},
        });
      }
      router.push(homePathForRoles(roles, hasProfile(session)));
    } catch {
      setError(schoolApiUnavailableMessage());
    }
  }

  return (
    <div className="auth-panel">
      <h1>Личный кабинет</h1>
      <p className="auth-lead">Вход в кабинет «Мастер меча» через OnlyID.</p>
      <a className="og-btn og-btn-primary auth-onlyid" href={onlyIdHref}>
        Войти через OnlyID
      </a>
      {error && <p className="auth-error">{error}</p>}

      <div className="auth-divider">или логин школы</div>

      <form onSubmit={onSubmit} className="auth-form">
        <label className="auth-field">
          Логин
          <input value={login} onChange={(e) => setLogin(e.target.value)} autoComplete="username" />
        </label>
        <label className="auth-field">
          Пароль
          <div className="auth-password">
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
            />
            <button
              type="button"
              onClick={() => setShowPassword((visible) => !visible)}
              aria-label={showPassword ? "Скрыть пароль" : "Показать пароль"}
              aria-pressed={showPassword}
            >
              <PasswordToggleIcon visible={showPassword} />
            </button>
          </div>
        </label>
        <button type="submit" className="og-btn og-btn-primary auth-submit">
          Войти
        </button>
      </form>
    </div>
  );
}
