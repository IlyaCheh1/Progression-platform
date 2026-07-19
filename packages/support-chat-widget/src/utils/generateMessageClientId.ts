export function generateClientId(): string {
  const gcrypto = (typeof globalThis !== 'undefined' ? (globalThis as any).crypto : undefined) as
    | Crypto
    | undefined;

  // modern browsers
  if (gcrypto && typeof (gcrypto as any).randomUUID === 'function') {
    return (gcrypto as any).randomUUID();
  }

  // fallback: RFC4122 v4 using crypto.getRandomValues if available
  if (gcrypto && typeof gcrypto.getRandomValues === 'function') {
    const bytes = new Uint8Array(16);
    gcrypto.getRandomValues(bytes);

    // set version bits (4) and variant bits (RFC4122)
    bytes[6] = (bytes[6] & 0x0f) | 0x40;
    bytes[8] = (bytes[8] & 0x3f) | 0x80;

    const hex = Array.from(bytes).map((b) => b.toString(16).padStart(2, '0'));
    return `${hex.slice(0, 4).join('')}-${hex.slice(4, 6).join('')}-${hex
      .slice(6, 8)
      .join('')}-${hex.slice(8, 10).join('')}-${hex.slice(10, 16).join('')}`;
  }

  // last resort fallback (not crypto-strong)
  const rnd = () =>
    Math.floor((1 + Math.random()) * 0x10000)
      .toString(16)
      .substring(1);
  return `${rnd()}${rnd()}-${rnd()}-${rnd()}-${rnd()}${rnd()}${rnd()}`;
}
