const MAX_EDGE_PX = 512;
const MAX_OUTPUT_BYTES = 320_000;
const ACCEPTED_TYPES = new Set(["image/jpeg", "image/jpg", "image/png", "image/webp"]);

export class AvatarUploadError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AvatarUploadError";
  }
}

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      URL.revokeObjectURL(url);
      resolve(image);
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new AvatarUploadError("Не удалось прочитать изображение."));
    };
    image.src = url;
  });
}

/** Compresses a user image into a JPEG data URL suitable for profile avatar storage. */
export async function fileToAvatarDataUrl(file: File): Promise<string> {
  if (!ACCEPTED_TYPES.has(file.type)) {
    throw new AvatarUploadError("Допустимы только JPEG, PNG или WebP.");
  }
  if (file.size > 8 * 1024 * 1024) {
    throw new AvatarUploadError("Файл слишком большой (макс. 8 МБ).");
  }

  const image = await loadImage(file);
  const scale = Math.min(1, MAX_EDGE_PX / Math.max(image.width, image.height, 1));
  const width = Math.max(1, Math.round(image.width * scale));
  const height = Math.max(1, Math.round(image.height * scale));

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new AvatarUploadError("Не удалось обработать изображение.");
  }
  ctx.drawImage(image, 0, 0, width, height);

  for (const quality of [0.85, 0.7, 0.55, 0.4]) {
    const dataUrl = canvas.toDataURL("image/jpeg", quality);
    if (dataUrl.length <= MAX_OUTPUT_BYTES) {
      return dataUrl;
    }
  }

  throw new AvatarUploadError("Не удалось сжать изображение. Выберите другой файл.");
}
