import {
  confirmAvatarUpload,
  messageForProfileError,
  PresignAvatarError,
  presignAvatarUpload,
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

/** Uploads avatar via school-api presigned S3 URL and confirms it on the profile. */
export async function uploadAvatarToS3(session: SessionUser, file: File): Promise<PlayerProfile> {
  validateAvatarFile(file);

  try {
    const { uploadUrl, fileId, key } = await presignAvatarUpload(session, {
      filename: file.name || "avatar.jpg",
      mimeType: file.type || "application/octet-stream",
      fileSize: file.size,
    });

    const putRes = await fetch(uploadUrl, {
      method: "PUT",
      headers: {
        "Content-Type": file.type || "application/octet-stream",
      },
      body: file,
    });
    if (!putRes.ok) {
      throw new AvatarUploadError("Не удалось загрузить файл в хранилище.");
    }

    return await confirmAvatarUpload(session, { fileId, key });
  } catch (error) {
    if (error instanceof AvatarUploadError || error instanceof PresignAvatarError) {
      throw error instanceof PresignAvatarError
        ? new AvatarUploadError(error.message)
        : error;
    }
    if (error instanceof TypeError) {
      throw new AvatarUploadError(messageForProfileError(error));
    }
    throw new AvatarUploadError(messageForProfileError(error));
  }
}
