import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const SCHOOL_API = process.env.NEXT_PUBLIC_SCHOOL_API ?? "http://localhost:8082";
export const AUTH_URL = process.env.NEXT_PUBLIC_AUTH_URL ?? "http://localhost:8083";
