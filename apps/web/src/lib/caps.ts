const CAPS_KEY = "mos.caps";
const DEFAULT_CAPS = 2500;

export function readCapsBalance(): number {
  if (typeof window === "undefined") return DEFAULT_CAPS;
  const raw = window.localStorage.getItem(CAPS_KEY);
  if (raw === null) {
    window.localStorage.setItem(CAPS_KEY, String(DEFAULT_CAPS));
    return DEFAULT_CAPS;
  }
  const value = Number(raw);
  return Number.isFinite(value) ? value : DEFAULT_CAPS;
}

export function writeCapsBalance(next: number) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(CAPS_KEY, String(Math.max(0, Math.floor(next))));
  window.dispatchEvent(new Event("mos.caps"));
}

export function spendCaps(amount: number): { ok: true; balance: number } | { ok: false; balance: number } {
  const balance = readCapsBalance();
  if (balance < amount) return { ok: false, balance };
  const next = balance - amount;
  writeCapsBalance(next);
  return { ok: true, balance: next };
}
