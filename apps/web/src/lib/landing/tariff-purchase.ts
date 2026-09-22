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

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function registrationErrors(value: PurchaseRegistration): Partial<Record<keyof PurchaseRegistration, string>> {
  const errors: Partial<Record<keyof PurchaseRegistration, string>> = {};
  if (!value.name.trim()) errors.name = "Укажите имя.";
  if (!value.surname.trim()) errors.surname = "Укажите фамилию.";
  if (!EMAIL_RE.test(value.email.trim())) errors.email = "Укажите почту.";
  if (!value.birthDate) errors.birthDate = "Укажите дату рождения.";
  if (!purchasePhone(value.phone)) errors.phone = "Укажите телефон.";
  if (value.gender !== "female" && value.gender !== "male") errors.gender = "Укажите пол.";
  return errors;
}

export function purchaseTariff(id: string) {
  return PURCHASE_TARIFFS.find((item) => item.id === id) ?? PURCHASE_TARIFFS[0];
}
