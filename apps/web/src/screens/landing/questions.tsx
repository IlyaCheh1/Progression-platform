"use client";

import { useRef, useState } from "react";
import Button from "@/components/ui/button";
import { useAudience } from "@/hooks/landing/useAudience";
import { useRevealFade } from "@/hooks/landing/useRevealFade";
import { faqForAudience } from "@/lib/landing/faq";
import { KIDS_WUSHU, kidsPhoneHref } from "@/lib/landing/kids-wushu";
import { LEGAL_ENTITY } from "@/lib/legal/content";
import { withAudience } from "@/lib/audience";

export default function Questions() {
  const sectionRef = useRef<HTMLElement>(null);
  const { mode, isKids } = useAudience();
  const [openId, setOpenId] = useState<string | null>(null);
  useRevealFade(sectionRef);
  const items = faqForAudience(isKids);

  return (
    <section id="faq" ref={sectionRef} className="questions-section relative py-24">
      <div className="relative z-10 mx-auto grid max-w-6xl gap-10 px-6 lg:grid-cols-[1.1fr_0.9fr] lg:items-start">
        <div className="reveal-fade">
          <span className="mb-3 block text-xs font-semibold uppercase tracking-[0.12em] text-mos-amber">
            Остались вопросы?
          </span>
          <h2 className="font-unbounded text-[calc(2.25rem-2pt)] font-medium text-white md:text-5xl">
            Напишите школе
          </h2>
          <p className="mt-4 max-w-lg text-sm leading-relaxed text-white/50">
            {isKids
              ? `${KIDS_WUSHU.enroll}: ${KIDS_WUSHU.phoneDisplay} · ${KIDS_WUSHU.trainerShort}. ${KIDS_WUSHU.cta} ${KIDS_WUSHU.places}.`
              : "Как в клубном фитнесе: сначала вопрос и заявка, потом зал. Реквизиты и сообщество — на странице контактов."}
          </p>
          <p className="mt-3 text-sm text-white/40">
            ВКонтакте:{" "}
            <a href={LEGAL_ENTITY.vkUrl} className="text-mos-amber hover:underline" target="_blank" rel="noreferrer">
              {LEGAL_ENTITY.vkUrl.replace("https://", "")}
            </a>
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button
              href={isKids ? kidsPhoneHref() : withAudience("/contact", mode)}
              variant="primary"
              size="md"
              className="uppercase"
            >
              {isKids ? KIDS_WUSHU.enroll : "Контакты"}
            </Button>
            <Button href={withAudience("/faq", mode)} variant="stroke" size="md" className="uppercase">
              Открыть FAQ
            </Button>
          </div>
        </div>

        <div className="reveal-fade space-y-2">
          {items.map((item) => {
            const open = openId === item.id;
            return (
              <div key={item.id} className="faq-item" data-open={open || undefined}>
                <button type="button" className="faq-item-q" aria-expanded={open} onClick={() => setOpenId(open ? null : item.id)}>
                  {item.question}
                  <span aria-hidden>{open ? "–" : "+"}</span>
                </button>
                {open ? <p className="faq-item-a">{item.answer}</p> : null}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
