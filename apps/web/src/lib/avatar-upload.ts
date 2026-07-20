import {
  messageForProfileError,
  ProfileApiError,
  uploadAvatarFile,
  type PlayerProfile,
} from "@/lib/profile-api";
import type { SessionUser } from "@/lib/session";

const MAX_FILE_SIZE_BYTES = 2 * 1024 * 1024;
const ACCEPTED_TYPES = new Set(["image/jpeg", "image/jpg", "image/png", "image/webp"]);

export class AvatarUploadError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AvatarUploadError";
  }
}

/** Validates an avatar source file before crop / upload. */
export function validateAvatarFile(file: File): void {
  if (!ACCEPTED_TYPES.has(file.type)) {
    throw new AvatarUploadError("Допустимы только JPEG, PNG или WebP.");
  }
  if (file.size > MAX_FILE_SIZE_BYTES) {
    throw new AvatarUploadError("Файл слишком большой (макс. 2 МБ).");
  }
}

/** Uploads avatar via school-api (server-side S3 put). */
export async function uploadAvatarToS3(session: SessionUser, file: File): Promise<PlayerProfile> {
  validateAvatarFile(file);

  try {
    return await uploadAvatarFile(session, file);
  } catch (error) {
    if (error instanceof AvatarUploadError) {
      throw error;
    }
    if (error instanceof ProfileApiError) {
      throw new AvatarUploadError(error.message);
    }
    throw new AvatarUploadError(messageForProfileError(error));
  }
}
