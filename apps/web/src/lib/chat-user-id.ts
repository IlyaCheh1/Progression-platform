const MOS_CHAT_NS = "6ba7b810-9dad-11d1-80b4-00c04fd430c8";

/** Stable UUID for og-chat API from platform student id (non-UUID strings). */
export async function chatUserIdFromStudentId(studentId: string): Promise<string> {
  const payload = new TextEncoder().encode(`${MOS_CHAT_NS}:mos-chat:${studentId}`);
  const digest = await crypto.subtle.digest("SHA-256", payload);
  const bytes = new Uint8Array(digest).slice(0, 16);
  bytes[6] = (bytes[6]! & 0x0f) | 0x50;
  bytes[8] = (bytes[8]! & 0x3f) | 0x80;
  const hex = [...bytes].map((b) => b.toString(16).padStart(2, "0")).join("");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}
