"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Button from "@/components/ui/button";
import { useAudience } from "@/hooks/landing/useAudience";
import { useRevealFade } from "@/hooks/landing/useRevealFade";
import { TRAINING_FORMATS, type TrainingFormat } from "@/lib/landing/training-formats";

export default function Services() {
  const sectionRef = useRef<HTMLElement>(null);
  const { isKids } = useAudience();
  const [openId, setOpenId] = useState<TrainingFormat["id"] | null>(null);
  const open = TRAINING_FORMATS.find((item) => item.id === openId) ?? null;
  const close = useCallback(() => setOpenId(null), []);
  useRevealFade(sectionRef);

  return (
    <section id="services" ref={sectionRef} className="relative px-4 py-16 md:px-6 md:py-24" style={{ background: "var(--void)" }}>
      <div className="landing-frame mx-auto max-w-6xl">
        <div className="landing-frame-head reveal-fade mb-8">
          <h2 className="font-unbounded text-3xl font-medium md:text-5xl">
            {isKids ? "Выберите удобный формат" : "Выбери свой формат"}
          </h2>
        </div>

        <ul className="format-grid">
          {TRAINING_FORMATS.map((format) => (
            <li key={format.id} className="reveal-fade">
              <article className="format-card">
                <div className="format-card-photo">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={format.photo} alt={format.alt} className="object-cover" />
                </div>
                <div className="format-card-body">
                  <h2 className="font-unbounded text-xl font-medium leading-tight text-white md:text-2xl">{format.title}</h2>
                  <p className="text-sm leading-relaxed text-white/55">{format.summary}</p>
                  <Button
                    type="button"
                    variant="primary"
                    size="sm"
                    className="format-card-more uppercase"
                    aria-haspopup="dialog"
                    onClick={() => setOpenId(format.id)}
                  >
                    Подробнее
                  </Button>
                </div>
              </article>
            </li>
          ))}
        </ul>
      </div>

      {open ? <FormatDialog format={open} onClose={close} /> : null}
    </section>
  );
}

function FormatDialog({ format, onClose }: { format: TrainingFormat; onClose: () => void }) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    const handleClose = () => {
      if (dialog.dataset.suppressClose === "1") {
        delete dialog.dataset.suppressClose;
        return;
      }
      onClose();
    };
    dialog.addEventListener("close", handleClose);
    if (!dialog.open) dialog.showModal();
    return () => {
      dialog.dataset.suppressClose = "1";
      dialog.removeEventListener("close", handleClose);
      if (dialog.open) dialog.close();
    };
  }, [onClose]);

  return (
    <dialog
      ref={dialogRef}
      className="format-dialog"
      aria-labelledby="format-dialog-title"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <button type="button" className="format-dialog-close" aria-label="Закрыть" onClick={onClose}>
        <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden>
          <path d="M6 6l12 12M18 6 6 18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      </button>
      <div className="format-dialog-layout">
        <div className="format-dialog-photo">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={format.photo} alt="" className="object-cover" />
        </div>
        <div className="format-dialog-copy">
          <h2 id="format-dialog-title" className="font-unbounded text-2xl font-medium leading-tight text-white md:text-4xl">
            {format.title}
          </h2>
          <div className="mt-5 space-y-4">
            {format.details.map((paragraph) => (
              <p key={paragraph} className="text-sm leading-relaxed text-white/70 md:text-base">
                {paragraph}
              </p>
            ))}
          </div>
        </div>
      </div>
    </dialog>
  );
}
