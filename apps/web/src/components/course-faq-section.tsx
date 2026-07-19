"use client";

import { useId, useMemo, useState } from "react";
import type { CourseFaqItem } from "@/lib/courses/types";

type CourseFaqSectionProps = {
  accentColor: string;
  title?: string;
  description?: string;
  items: readonly CourseFaqItem[];
};

function hexToRgb(hex: string) {
  const normalized = hex.replace("#", "");
  return {
    r: parseInt(normalized.slice(0, 2), 16),
    g: parseInt(normalized.slice(2, 4), 16),
    b: parseInt(normalized.slice(4, 6), 16),
  };
}

function buildFaqTheme(accentColor: string) {
  const { r, g, b } = hexToRgb(accentColor);

  return {
    eyebrowGradient: `linear-gradient(135deg, rgba(${Math.min(r + 48, 255)}, ${Math.min(g + 48, 255)}, ${Math.min(b + 48, 255)}, 1) 0%, rgba(${r}, ${g}, ${b}, 1) 52%, rgba(${Math.max(r - 24, 0)}, ${Math.max(g - 24, 0)}, ${Math.max(b - 24, 0)}, 1) 100%)`,
    itemBackground: `linear-gradient(112deg, rgba(${r}, ${g}, ${b}, 0.34) -9.65%, rgba(11, 11, 12, 0.98) 44.31%)`,
    chevronMuted: `rgba(${r}, ${g}, ${b}, 0.45)`,
    chevronActive: accentColor,
    questionActive: accentColor,
  };
}

function ChevronDown({ open, mutedColor, activeColor }: { open: boolean; mutedColor: string; activeColor: string }) {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden
      className={`size-5 shrink-0 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
      style={{ color: open ? activeColor : mutedColor }}
    >
      <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function CourseFaqSection({
  accentColor,
  title = "Частые вопросы",
  description = "Ответы на популярные вопросы о курсе, расписании и записи",
  items,
}: CourseFaqSectionProps) {
  const [openQuestion, setOpenQuestion] = useState<string | null>(null);
  const baseId = useId();
  const theme = useMemo(() => buildFaqTheme(accentColor), [accentColor]);

  return (
    <section className="course-faq-section py-20 text-mos-text md:py-28">
      <div className="mx-auto max-w-4xl space-y-12">
        <div className="text-center">
          <span
            className="font-unbounded text-[10px] font-bold uppercase tracking-[0.06em]"
            style={{
              backgroundImage: theme.eyebrowGradient,
              WebkitBackgroundClip: "text",
              backgroundClip: "text",
              WebkitTextFillColor: "transparent",
              color: "transparent",
            }}
          >
            FAQ
          </span>
          <h2 className="mt-3 text-balance font-unbounded text-2xl font-medium leading-7 md:text-[32px] md:leading-9">
            {title}
          </h2>
          {description ? (
            <p className="mx-auto mt-4 max-w-2xl text-base text-mos-text/55">{description}</p>
          ) : null}
        </div>

        <div className="space-y-4">
          {items.map((item, index) => {
            const isOpen = openQuestion === item.question;
            const contentId = `${baseId}-${index}`;

            return (
              <div
                key={item.question}
                className="overflow-hidden rounded-2xl"
                style={{ background: theme.itemBackground }}
              >
                <button
                  type="button"
                  aria-expanded={isOpen}
                  aria-controls={contentId}
                  onClick={() => setOpenQuestion(isOpen ? null : item.question)}
                  className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left"
                >
                  <span
                    className="font-unbounded text-base font-normal transition-colors duration-200"
                    style={{ color: isOpen ? theme.questionActive : "var(--mos-text)" }}
                  >
                    {item.question}
                  </span>
                  <ChevronDown
                    open={isOpen}
                    mutedColor={theme.chevronMuted}
                    activeColor={theme.chevronActive}
                  />
                </button>

                <div
                  id={contentId}
                  className={`grid transition-[grid-template-rows] duration-200 ease-out ${
                    isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
                  }`}
                >
                  <div className="overflow-hidden">
                    <div className="px-6 pb-5 text-sm leading-relaxed text-mos-text/55">
                      <p>{item.answer}</p>
                      {item.list ? (
                        <ul className="mt-3 list-disc space-y-1 pl-5">
                          {item.list.map((entry) => (
                            <li key={entry}>{entry}</li>
                          ))}
                        </ul>
                      ) : null}
                      {item.extra ? <p className="mt-3">{item.extra}</p> : null}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
