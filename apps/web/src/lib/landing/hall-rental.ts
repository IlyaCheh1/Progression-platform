/** Public hall rental canon. Inbox in coach/admin LK is Phase 2. */

export const HALL_RENTAL_ADMIN_ROLES = ["administrator", "platform_admin"] as const;

export const HALL_RENTAL_FACTS = {
  price: "3 000 ₽ / час",
  area: "80 м²",
  mirrors: "Зеркала",
  floor: "ласточкин хвост",
} as const;

export const HALL_RENTAL_DAYS = [
  { id: "mon", label: "Пн" },
  { id: "tue", label: "Вт" },
  { id: "wed", label: "Ср" },
  { id: "thu", label: "Чт" },
  { id: "fri", label: "Пт" },
  { id: "sat", label: "Сб" },
  { id: "sun", label: "Вс" },
] as const;

export type HallRentalDayId = (typeof HALL_RENTAL_DAYS)[number]["id"];

export const HALL_RENTAL_CADENCE = [
  { id: "one_time", label: "Разово" },
  { id: "recurring", label: "Регулярно" },
] as const;

export type HallRentalCadence = (typeof HALL_RENTAL_CADENCE)[number]["id"];

export const HALL_RENTAL_PHOTOS = [
  { src: "/media/arenda/hall-area.svg", alt: "Макет зала: площадь 80 м²", caption: "Макет · 80 м²" },
  { src: "/media/arenda/hall-mirrors.svg", alt: "Макет зала: зеркала", caption: "Макет · зеркала" },
  { src: "/media/arenda/hall-floor.svg", alt: "Макет зала: покрытие ласточкин хвост", caption: "Макет · покрытие" },
  { src: "/media/arenda/hall-light.svg", alt: "Макет зала: свет и пространство", caption: "Макет · зал" },
] as const;

export const HALL_RENTAL_HOURS_MIN = 1;
export const HALL_RENTAL_HOURS_MAX = 8;

export type HallRentalInput = {
  days: string[];
  startTime: string;
  hours: number;
  cadence: string;
  name: string;
  phone: string;
  email?: string;
  comment?: string;
};

export type HallRentalRequest = HallRentalInput & {
  id: string;
  createdAt: string;
  destinedRoles: typeof HALL_RENTAL_ADMIN_ROLES;
  source: "public-landing";
};

export type HallRentalFieldErrors = Partial<Record<keyof HallRentalInput, string>>;

export type HallRentalValidation =
  | { ok: true; value: Omit<HallRentalRequest, "id" | "createdAt"> }
  | { ok: false; errors: HallRentalFieldErrors };

const DAY_IDS = new Set<string>(HALL_RENTAL_DAYS.map((day) => day.id));
const CADENCE_IDS = new Set<string>(HALL_RENTAL_CADENCE.map((item) => item.id));
const TIME_RE = /^([01]\d|2[0-3]):([0-5]\d)$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function cleanText(value: unknown, max: number): string {
  if (typeof value !== "string") return "";
  return value.replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g, "").trim().slice(0, max);
}

export function digitsOnly(value: string): string {
  return value.replace(/\D/g, "");
}

export function normalizePhone(raw: string): string {
  const digits = digitsOnly(raw);
  if (digits.length === 11 && (digits.startsWith("7") || digits.startsWith("8"))) {
    return `+7${digits.slice(1)}`;
  }
  if (digits.length === 10) {
    return `+7${digits}`;
  }
  return raw.trim();
}

export function validateHallRentalInput(raw: unknown): HallRentalValidation {
  const body = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
  const errors: HallRentalFieldErrors = {};

  const daysRaw = Array.isArray(body.days) ? body.days : [];
  const days = [...new Set(daysRaw.filter((item): item is string => typeof item === "string" && DAY_IDS.has(item)))];
  if (days.length === 0) {
    errors.days = "Выберите хотя бы один день.";
  }

  const startTime = typeof body.startTime === "string" ? body.startTime.trim() : "";
  if (!TIME_RE.test(startTime)) {
    errors.startTime = "Укажите время начала в формате ЧЧ:ММ.";
  }

  const hours = typeof body.hours === "number" ? body.hours : Number(body.hours);
  if (!Number.isInteger(hours) || hours < HALL_RENTAL_HOURS_MIN || hours > HALL_RENTAL_HOURS_MAX) {
    errors.hours = `Длительность — от ${HALL_RENTAL_HOURS_MIN} до ${HALL_RENTAL_HOURS_MAX} часов.`;
  }

  const cadence = typeof body.cadence === "string" ? body.cadence : "";
  if (!CADENCE_IDS.has(cadence)) {
    errors.cadence = "Выберите: разово или регулярно.";
  }

  const name = cleanText(body.name, 80);
  if (name.length < 2) {
    errors.name = "Укажите имя.";
  }

  const phoneRaw = cleanText(body.phone, 32);
  const phoneDigits = digitsOnly(phoneRaw);
  if (phoneDigits.length < 10 || phoneDigits.length > 15) {
    errors.phone = "Укажите телефон, минимум 10 цифр.";
  }

  const email = cleanText(body.email, 120);
  if (email && !EMAIL_RE.test(email)) {
    errors.email = "Некорректный email.";
  }

  const comment = cleanText(body.comment, 1000);

  if (Object.keys(errors).length > 0) {
    return { ok: false, errors };
  }

  return {
    ok: true,
    value: {
      days,
      startTime,
      hours,
      cadence: cadence as HallRentalCadence,
      name,
      phone: normalizePhone(phoneRaw),
      email: email || undefined,
      comment: comment || undefined,
      destinedRoles: HALL_RENTAL_ADMIN_ROLES,
      source: "public-landing",
    },
  };
}

export function labelForDay(id: string): string {
  return HALL_RENTAL_DAYS.find((day) => day.id === id)?.label ?? id;
}

export function labelForCadence(id: string): string {
  return HALL_RENTAL_CADENCE.find((item) => item.id === id)?.label ?? id;
}

export function parseBearerToken(header: string | null): string | null {
  if (!header) return null;
  const match = header.match(/^Bearer\s+(\S+)$/i);
  return match?.[1] ?? null;
}
