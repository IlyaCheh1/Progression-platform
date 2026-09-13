export const LANDING_LEAD_SOURCE = "landing-join";
export const COURSE_LEAD_SOURCE = "course-enroll";

const DIRECTION_RE = /^[a-z0-9][a-z0-9-]{0,47}$/;

function digitsOnly(value: string): string {
  return value.replace(/\D/g, "");
}

function normalizePhone(raw: string): string {
  const digits = digitsOnly(raw);
  if (digits.length === 11 && (digits.startsWith("7") || digits.startsWith("8"))) {
    return `+7${digits.slice(1)}`;
  }
  if (digits.length === 10) {
    return `+7${digits}`;
  }
  return raw.trim();
}

export type LandingLeadInput = {
  name: string;
  phone: string;
  email?: string;
  comment?: string;
  direction?: string;
  source?: string;
};

export type LandingLeadRequest = LandingLeadInput & {
  id: string;
  createdAt: string;
  source: string;
};

export type LandingLeadFieldErrors = Partial<Record<keyof LandingLeadInput, string>>;

export type LandingLeadValidation =
  | { ok: true; value: Omit<LandingLeadRequest, "id" | "createdAt"> }
  | { ok: false; errors: LandingLeadFieldErrors };

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function cleanText(value: unknown, max: number): string {
  if (typeof value !== "string") return "";
  return value.replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g, "").trim().slice(0, max);
}

export function validateLandingLeadInput(raw: unknown): LandingLeadValidation {
  const body = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
  const errors: LandingLeadFieldErrors = {};

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
  const direction = cleanText(body.direction, 48).toLowerCase();
  if (direction && !DIRECTION_RE.test(direction)) {
    errors.direction = "Некорректное направление.";
  }

  const sourceRaw = cleanText(body.source, 40);
  const source = sourceRaw || (direction ? COURSE_LEAD_SOURCE : LANDING_LEAD_SOURCE);

  if (Object.keys(errors).length > 0) {
    return { ok: false, errors };
  }

  return {
    ok: true,
    value: {
      name,
      phone: normalizePhone(phoneRaw),
      email: email || undefined,
      comment: comment || undefined,
      direction: direction || undefined,
      source,
    },
  };
}
