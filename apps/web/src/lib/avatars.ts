export type GenderId = "MALE" | "FEMALE";

export function normalizeGender(value?: string | null): GenderId {
  return value === "FEMALE" ? "FEMALE" : "MALE";
}
