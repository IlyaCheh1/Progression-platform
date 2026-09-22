import { normalizePhone } from "./hall-rental.ts";
import { LEGAL_ENTITY } from "../legal/content.ts";

/** Landing purchase catalog. These are the public tariff cards, not checkout keys. */
export const PURCHASE_TARIFFS = [
  { id: "trial", lane: "Групповые", label: "Пробное занятие", priceLabel: "1 000 ₽" },
  { id: "monthly", lane: "Групповые", label: "Абонемент", priceLabel: "от 5 000 ₽" },
  { id: "single", lane: "Групповые", label: "Разовое занятие", priceLabel: "2 000 ₽" },
  { id: "solo-single", lane: "Персональные", label: "Разовое занятие", priceLabel: "4 000 ₽" },
  { id: "solo-monthly", lane: "Персональные", label: "Абонемент", priceLabel: "от 12 800 ₽" },
  { id: "solo-online", lane: "Персональные", label: "Онлайн", priceLabel: "4 000 ₽" },
  { id: "split", lane: "Сплиты", label: "Сплит", priceLabel: "макет · 2 человека" },
] as const;

export type PurchaseTariffId = (typeof PURCHASE_TARIFFS)[number]["id"];

export const PURCHASE_SCHOOL_NAME = LEGAL_ENTITY.siteName;

export const PURCHASE_ONLINE_ADDON = {
  title: "Онлайн-тренировки",
  detail: "Теория фехтования и ушу, видеотренировки и разборы.",
  priceLabel: "4 000 ₽",
} as const;

export const PURCHASE_PAYMENT_NOTICE =
  "Оплата с лендинга не отправляется. Платёжный ключ не используется.";

export type PurchaseLookup = { known: boolean };

/**
 * There is no client phone directory. Every number is a new client.
 * The phone is not logged or stored.
 */
export function lookupPurchaseClient(_phone: string): PurchaseLookup {
  return { known: false };
}

export function purchasePhone(raw: string): string | null {
  const phone = normalizePhone(raw);
  return /^\+7\d{10}$/.test(phone) ? phone : null;
}

export type PurchaseGender = "female" | "male";

export type PurchaseRegistration = {
  name: string;
  surname: string;
  email: string;
  birthDate: string;
  phone: string;
  gender: PurchaseGender | "";
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const PERSON_NAME_RE = /^[\p{L}][\p{L}\s'’-]*$/u;

function personNameError(value: string, empty: string, bad: string): string | undefined {
  const text = value.trim();
  if (text.length < 2) return empty;
  if (!PERSON_NAME_RE.test(text)) return bad;
  return undefined;
}

function birthDateError(value: string): string | undefined {
  if (!value.trim()) return "Укажите дату рождения.";
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return "Укажите реальную дату рождения.";
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  const real =
    date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
  if (!real || year < 1900) return "Укажите реальную дату рождения.";
  const today = new Date();
  const todayUtc = Date.UTC(today.getFullYear(), today.getMonth(), today.getDate());
  if (date.getTime() > todayUtc) return "Дата рождения не может быть в будущем.";
  let age = today.getFullYear() - year;
  const monthDelta = today.getMonth() + 1 - month;
  if (monthDelta < 0 || (monthDelta === 0 && today.getDate() < day)) age -= 1;
  if (age > 100) return "Укажите реальную дату рождения.";
  return undefined;
}

export function registrationErrors(value: PurchaseRegistration): Partial<Record<keyof PurchaseRegistration, string>> {
  const errors: Partial<Record<keyof PurchaseRegistration, string>> = {};
  const name = personNameError(value.name, "Укажите имя.", "Имя — только буквы, минимум 2.");
  const surname = personNameError(value.surname, "Укажите фамилию.", "Фамилия — только буквы, минимум 2.");
  if (name) errors.name = name;
  if (surname) errors.surname = surname;
  if (!EMAIL_RE.test(value.email.trim())) errors.email = "Укажите почту.";
  const birthDate = birthDateError(value.birthDate);
  if (birthDate) errors.birthDate = birthDate;
  if (!purchasePhone(value.phone)) errors.phone = "Укажите телефон в формате +7 и 10 цифр.";
  if (value.gender !== "female" && value.gender !== "male") errors.gender = "Выберите пол.";
  return errors;
}

export function purchaseTariff(id: string) {
  return PURCHASE_TARIFFS.find((item) => item.id === id) ?? PURCHASE_TARIFFS[0];
}
