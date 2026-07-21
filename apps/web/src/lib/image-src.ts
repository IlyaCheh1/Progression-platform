/** Whether next/image can optimize this src with our configured remotePatterns. */
export function canOptimizeImageSrc(src: string): boolean {
  if (src.startsWith("/")) return true;
  try {
    const host = new URL(src).hostname.toLowerCase();
    return host.endsWith(".selstorage.ru") || host.endsWith(".selcdn.ru");
  } catch {
    return false;
  }
}
