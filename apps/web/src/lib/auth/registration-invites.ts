/** httpOnly cookie set only while a registration link starts the existing OnlyID flow. */
export const REGISTRATION_INVITE_COOKIE = "mos_registration_invite";
/** Same window as the PKCE cookie: long enough to finish OnlyID, not a second session. */
export const REGISTRATION_INVITE_MAX_AGE = 600;

const INVITE_TTL_MS = 7 * 24 * 60 * 60 * 1000;
const TOKEN_PATTERN = /^[A-Za-z0-9_-]{20,128}$/;
const NAME_PATTERN = /^[\p{L}\p{M}][\p{L}\p{M}\s.'-]{1,79}$/u;
const LOGIN_PATTERN = /^[A-Za-z0-9._@+-]{2,80}$/;

export type RegistrationInvite = {
  token: string;
  displayName: string;
  login: string;
  createdAt: number;
  expiresAt: number;
  usedAt: number | null;
};

export type InviteDraft = {
  displayName: string;
  login: string;
};

type InviteLookup =
  | { status: "missing" }
  | { status: "active" | "used" | "expired"; invite: RegistrationInvite };

const globalStore = globalThis as typeof globalThis & {
  __mosRegistrationInvites?: Map<string, RegistrationInvite>;
};
const invites = globalStore.__mosRegistrationInvites ?? new Map<string, RegistrationInvite>();
globalStore.__mosRegistrationInvites = invites;

function registrationToken(): string {
  const buf = crypto.getRandomValues(new Uint8Array(32));
  return Buffer.from(buf).toString("base64url");
}

/**
 * No mail sender is configured in this app. Registration links are returned
 * for the admin to copy. Do not add SMTP here.
 */
export function registrationDelivery(): { mailed: false } {
  return { mailed: false };
}

export function clearRegistrationInvites(): void {
  invites.clear();
}

export function parseInviteDraft(input: unknown): { ok: true; value: InviteDraft } | { ok: false; error: "bad_request" } {
  if (!input || typeof input !== "object") return { ok: false, error: "bad_request" };
  const raw = input as { displayName?: unknown; login?: unknown };
  const displayName = typeof raw.displayName === "string" ? raw.displayName.trim().replace(/\s+/g, " ") : "";
  const login = typeof raw.login === "string" ? raw.login.trim() : "";
  if (!NAME_PATTERN.test(displayName) || !LOGIN_PATTERN.test(login)) {
    return { ok: false, error: "bad_request" };
  }
  return { ok: true, value: { displayName, login } };
}

export function createRegistrationInvite(draft: InviteDraft, now = Date.now()): RegistrationInvite {
  const token = registrationToken();
  const invite: RegistrationInvite = {
    token,
    displayName: draft.displayName,
    login: draft.login,
    createdAt: now,
    expiresAt: now + INVITE_TTL_MS,
    usedAt: null,
  };
  invites.set(token, invite);
  return invite;
}

export function isRegistrationToken(token: string): boolean {
  return TOKEN_PATTERN.test(token);
}

export function lookupRegistrationInvite(token: string, now = Date.now()): InviteLookup {
  if (!isRegistrationToken(token)) return { status: "missing" };
  const invite = invites.get(token);
  if (!invite) return { status: "missing" };
  if (invite.usedAt != null) return { status: "used", invite };
  if (invite.expiresAt <= now) return { status: "expired", invite };
  return { status: "active", invite };
}

export function readRegistrationInvite(token: string, now = Date.now()): RegistrationInvite | null {
  const looked = lookupRegistrationInvite(token, now);
  return looked.status === "active" ? looked.invite : null;
}

export function consumeRegistrationInvite(token: string, now = Date.now()): RegistrationInvite | null {
  const invite = readRegistrationInvite(token, now);
  if (!invite) return null;
  const used = { ...invite, usedAt: now };
  invites.set(token, used);
  return used;
}

/** An email login must match the OnlyID address. Any other login is a label; OnlyID still owns the school login. */
export function inviteAcceptsOnlyIdEmail(login: string, email: string): boolean {
  if (!login.includes("@")) return true;
  return login.trim().toLowerCase() === email.trim().toLowerCase();
}

export function buildIssuedRegistrationLink(origin: string, invite: RegistrationInvite) {
  const base = origin.replace(/\/$/, "");
  return {
    url: `${base}/register/${invite.token}`,
    ...registrationDelivery(),
    displayName: invite.displayName,
    login: invite.login,
    expiresAt: new Date(invite.expiresAt).toISOString(),
  };
}

export type SchoolUsersReadAccess = "ok" | "forbidden" | "unavailable";

export async function schoolUsersReadAccess(
  authorization: string | null,
  fetchImpl: typeof fetch = fetch,
  schoolApiBase = "http://127.0.0.1:8082",
): Promise<SchoolUsersReadAccess> {
  if (!authorization || !/^Bearer\s+\S+/i.test(authorization)) return "forbidden";
  try {
    const res = await fetchImpl(`${schoolApiBase.replace(/\/$/, "")}/v1/admin/students`, {
      headers: { Authorization: authorization },
      cache: "no-store",
    });
    if (res.status === 401 || res.status === 403) return "forbidden";
    if (!res.ok) return "unavailable";
    return "ok";
  } catch {
    return "unavailable";
  }
}

export const ONLYID_ERROR_MESSAGES: Record<string, string> = {
  sso_not_configured: "Вход через OnlyID не настроен на сервере.",
  sso_error: "Ошибка входа через OnlyID. Попробуйте снова.",
  invalid_callback: "Некорректный ответ OnlyID.",
  invalid_state: "Не удалось сохранить сессию входа. Попробуйте ещё раз в том же браузере.",
  token_exchange_failed: "OnlyID не выдал токен.",
  provision_failed: "Не удалось создать школьный аккаунт. Попробуйте снова.",
  user_blocked: "Аккаунт OnlyID заблокирован.",
  no_email: "У аккаунта OnlyID нет email.",
  school_session_failed: "Не удалось создать сессию школы.",
  email_mismatch: "OnlyID вошёл другим адресом. Нужен адрес, который указал администратор.",
  invite_closed: "Ссылка на регистрацию уже не действует.",
};
