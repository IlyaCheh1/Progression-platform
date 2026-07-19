/** Локальные настройки профиля (поля вне Engine `/v1/profile`). */

export type PersonalLocal = {
  firstName: string;
  lastName: string;
  birthDate: string;
  phone: string;
  about: string;
  country: string;
  language: string;
};

export type PrivacyLocal = {
  profileVisibility: "PUBLIC" | "FRIENDS_ONLY" | "PRIVATE";
  messagePermission: "EVERYONE" | "FRIENDS_DM" | "NOBODY";
};

export type NotificationsLocal = {
  training: boolean;
  quests: boolean;
  emailEnabled: boolean;
  contactEmail: string;
  emailVerified: boolean;
};

const PERSONAL_KEY = "mos.settings.personal";
const PRIVACY_KEY = "mos.settings.privacy";
const NOTIFY_KEY = "mos.settings.notifications";

export const COUNTRY_OPTIONS = [
  { value: "RU", label: "Россия" },
  { value: "BY", label: "Беларусь" },
  { value: "KZ", label: "Казахстан" },
  { value: "OTHER", label: "Другая" },
];

export const DEFAULT_PERSONAL: PersonalLocal = {
  firstName: "",
  lastName: "",
  birthDate: "",
  phone: "",
  about: "",
  country: "RU",
  language: "RU",
};

export const DEFAULT_PRIVACY: PrivacyLocal = {
  profileVisibility: "FRIENDS_ONLY",
  messagePermission: "FRIENDS_DM",
};

export const DEFAULT_NOTIFICATIONS: NotificationsLocal = {
  training: true,
  quests: true,
  emailEnabled: false,
  contactEmail: "",
  emailVerified: false,
};

function readJson<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    return { ...fallback, ...(JSON.parse(raw) as T) };
  } catch {
    return fallback;
  }
}

export function loadPersonalLocal(): PersonalLocal {
  return readJson(PERSONAL_KEY, DEFAULT_PERSONAL);
}

export function savePersonalLocal(data: PersonalLocal) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(PERSONAL_KEY, JSON.stringify(data));
}

export function loadPrivacyLocal(): PrivacyLocal {
  return readJson(PRIVACY_KEY, DEFAULT_PRIVACY);
}

export function savePrivacyLocal(data: PrivacyLocal) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(PRIVACY_KEY, JSON.stringify(data));
}

export function loadNotificationsLocal(): NotificationsLocal {
  return readJson(NOTIFY_KEY, DEFAULT_NOTIFICATIONS);
}

export function saveNotificationsLocal(data: NotificationsLocal) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(NOTIFY_KEY, JSON.stringify(data));
}
