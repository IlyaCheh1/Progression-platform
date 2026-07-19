const COINS_KEY = "mos.coins";
const LEGACY_CAPS_KEY = "mos.caps";
const COINS_EVENT = "mos.coins";
const DEFAULT_COINS = 2500;

function parseBalance(raw: string | null): number | null {
  if (raw === null) return null;
  const value = Number(raw);
  return Number.isFinite(value) ? Math.max(0, Math.floor(value)) : null;
}

export function readCoinsBalance(): number {
  if (typeof window === "undefined") return DEFAULT_COINS;

  const current = parseBalance(window.localStorage.getItem(COINS_KEY));
  if (current !== null) return current;

  const legacy = parseBalance(window.localStorage.getItem(LEGACY_CAPS_KEY));
  const seeded = legacy ?? DEFAULT_COINS;
  window.localStorage.setItem(COINS_KEY, String(seeded));
  if (legacy !== null) window.localStorage.removeItem(LEGACY_CAPS_KEY);
  return seeded;
}

export function writeCoinsBalance(next: number) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(COINS_KEY, String(Math.max(0, Math.floor(next))));
  window.dispatchEvent(new Event(COINS_EVENT));
}

export function spendCoins(
  amount: number,
): { ok: true; balance: number } | { ok: false; balance: number } {
  const balance = readCoinsBalance();
  if (balance < amount) return { ok: false, balance };
  const next = balance - amount;
  writeCoinsBalance(next);
  return { ok: true, balance: next };
}

export function earnCoins(amount: number): number {
  if (!Number.isFinite(amount) || amount <= 0) return readCoinsBalance();
  const next = readCoinsBalance() + Math.floor(amount);
  writeCoinsBalance(next);
  return next;
}

export const COINS_CHANGED_EVENT = COINS_EVENT;
