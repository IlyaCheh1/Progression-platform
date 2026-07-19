"use client";

import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import Cropper, { type Area } from "react-easy-crop";
import "react-easy-crop/react-easy-crop.css";
import { cropImageToAvatarFile } from "@/lib/crop-image";
import { cn } from "@/lib/utils";

type AvatarCropModalProps = {
  open: boolean;
  imageSrc: string | null;
  filename?: string;
  busy?: boolean;
  onCancel: () => void;
  onConfirm: (file: File) => void | Promise<void>;
};

function IconClose() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M6 6l12 12M18 6 6 18" strokeLinecap="round" />
    </svg>
  );
}

function IconMinus() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M5 12h14" strokeLinecap="round" />
    </svg>
  );
}

function IconPlus() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 5v14M5 12h14" strokeLinecap="round" />
    </svg>
  );
}

const MIN_ZOOM = 1;
const MAX_ZOOM = 3;
const ZOOM_STEP = 0.1;

export default function AvatarCropModal({
  open,
  imageSrc,
  filename = "avatar.jpg",
  busy = false,
  onCancel,
  onConfirm,
}: AvatarCropModalProps) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setCroppedAreaPixels(null);
    setProcessing(false);
    setError("");
  }, [open, imageSrc]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !busy && !processing) onCancel();
    };
    document.addEventListener("keydown", onKeyDown);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = prevOverflow;
    };
  }, [busy, onCancel, open, processing]);

  const onCropComplete = useCallback((_area: Area, pixels: Area) => {
    setCroppedAreaPixels(pixels);
  }, []);

  async function handleConfirm() {
    if (!imageSrc || !croppedAreaPixels || busy || processing) return;
    setProcessing(true);
    setError("");
    try {
      const file = await cropImageToAvatarFile(imageSrc, croppedAreaPixels, filename);
      await onConfirm(file);
    } catch (error) {
      setError(
        error instanceof Error && error.message
          ? error.message
          : "Не удалось обрезать изображение. Попробуйте другой файл.",
      );
    } finally {
      setProcessing(false);
    }
  }

  if (!open || !imageSrc || typeof document === "undefined") return null;

  const disabled = busy || processing;

  return createPortal(
    <div
      className="fixed inset-0 z-[120] flex items-end justify-center bg-black/70 p-0 backdrop-blur-sm md:items-center md:p-4"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !disabled) onCancel();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="avatar-crop-title"
        className="bg-secondaryBg flex max-h-[92lvh] w-full max-w-[480px] flex-col overflow-hidden rounded-t-[28px] shadow-2xl md:rounded-[32px]"
      >
        <div className="flex items-center justify-between border-b border-white/10 px-4 py-4 md:px-6">
          <h2 id="avatar-crop-title" className="font-display text-sm font-medium text-mos-text md:text-base">
            Обрезка аватара
          </h2>
          <button
            type="button"
            onClick={onCancel}
            disabled={disabled}
            className="rounded-xl p-2 text-mos-muted transition-colors hover:bg-white/5 hover:text-mos-text disabled:opacity-50"
            aria-label="Закрыть"
          >
            <IconClose />
          </button>
        </div>

        <div className="flex flex-col gap-4 px-4 py-4 md:px-6 md:py-5">
          <p className="text-xs text-mos-muted md:text-sm">
            Перетащите фото и выберите область. Круг — то, что увидят в профиле.
          </p>

          <div className="relative mx-auto aspect-square w-full max-w-[360px] overflow-hidden rounded-2xl bg-mos-bg">
            <Cropper
              image={imageSrc}
              crop={crop}
              zoom={zoom}
              aspect={1}
              cropShape="round"
              showGrid={false}
              minZoom={MIN_ZOOM}
              maxZoom={MAX_ZOOM}
              onCropChange={setCrop}
              onZoomChange={setZoom}
              onCropComplete={onCropComplete}
              style={{
                containerStyle: { background: "#0b0b0c" },
                cropAreaStyle: {
                  border: "2px solid rgba(212, 168, 75, 0.85)",
                  boxShadow: "0 0 0 9999px rgba(0, 0, 0, 0.55)",
                },
              }}
            />
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              disabled={disabled || zoom <= MIN_ZOOM}
              onClick={() => setZoom((value) => Math.max(MIN_ZOOM, Number((value - ZOOM_STEP).toFixed(2))))}
              className="rounded-xl p-2 text-mos-muted transition-colors hover:bg-white/5 hover:text-mos-text disabled:opacity-40"
              aria-label="Отдалить"
            >
              <IconMinus />
            </button>
            <input
              type="range"
              min={MIN_ZOOM}
              max={MAX_ZOOM}
              step={ZOOM_STEP}
              value={zoom}
              disabled={disabled}
              onChange={(event) => setZoom(Number(event.target.value))}
              className={cn(
                "h-1.5 w-full cursor-pointer appearance-none rounded-full bg-white/15 accent-mos-amber",
                "disabled:cursor-not-allowed disabled:opacity-50",
              )}
              aria-label="Масштаб"
            />
            <button
              type="button"
              disabled={disabled || zoom >= MAX_ZOOM}
              onClick={() => setZoom((value) => Math.min(MAX_ZOOM, Number((value + ZOOM_STEP).toFixed(2))))}
              className="rounded-xl p-2 text-mos-muted transition-colors hover:bg-white/5 hover:text-mos-text disabled:opacity-40"
              aria-label="Приблизить"
            >
              <IconPlus />
            </button>
          </div>

          {error ? <p className="text-center text-sm text-mos-danger">{error}</p> : null}
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-white/10 px-4 py-3 md:px-6 md:py-4">
          <button
            type="button"
            onClick={onCancel}
            disabled={disabled}
            className="og-btn og-btn-secondary og-btn-sm uppercase disabled:opacity-50"
          >
            Отмена
          </button>
          <button
            type="button"
            onClick={() => void handleConfirm()}
            disabled={disabled || !croppedAreaPixels}
            className="og-btn og-btn-primary og-btn-sm uppercase disabled:opacity-50"
          >
            {busy || processing ? "Сохраняем…" : "Сохранить"}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
