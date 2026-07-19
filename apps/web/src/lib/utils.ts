import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const SCHOOL_API = process.env.NEXT_PUBLIC_SCHOOL_API ?? "http://localhost:8082";
export const AUTH_URL = process.env.NEXT_PUBLIC_AUTH_URL ?? "http://localhost:8083";

export function schoolApiUnavailableMessage(): string {
  const isBrowser = typeof window !== "undefined";
  const onProductionHost =
    isBrowser && !["localhost", "127.0.0.1"].includes(window.location.hostname);
  const usesLocalApi =
    SCHOOL_API.includes("localhost") || SCHOOL_API.includes("127.0.0.1");

  if (onProductionHost && usesLocalApi) {
    return "API недоступен: в web не задан NEXT_PUBLIC_SCHOOL_API. Укажите публичный URL school-api в Coolify и сделайте Rebuild.";
  }

  return `API недоступен (${SCHOOL_API}). Проверьте, что school-api запущен и открывается по HTTPS.`;
}
