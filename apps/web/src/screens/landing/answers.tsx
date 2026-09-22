"use client";

import { useRef, useState } from "react";
import { useRevealFade } from "@/hooks/landing/useRevealFade";
import { FAQ_GROUPS, type FaqGroupId } from "@/lib/landing/faq-groups";

export default function Answers() {
  const sectionRef = useRef<HTMLElement>(null);
  const [groupId, setGroupId] = useState<FaqGroupId>("subscription");
  const [openId, setOpenId] = useState<string | null>(null);
  useRevealFade(sectionRef);
  const group = FAQ_GROUPS.find((item) => item.id === groupId) ?? FAQ_GROUPS[0];

  return (
    <section id="answers" ref={sectionRef} className="answers-section relative px-4 py-16 md:px-6 md:py-24" style={{ background: "var(--void)" }}>
      <div className="landing-frame relative z-10 mx-auto max-w-3xl">
        <div className="landing-frame-head reveal-fade">
          <h2 className="font-unbounded text-3xl font-medium md:text-5xl">Вопросы и ответы</h2>
        </div>
        <div className="reveal-fade mt-8 flex flex-wrap gap-2" role="tablist" aria-label="Темы вопросов">
          {FAQ_GROUPS.map((item) => {
            const active = item.id === group.id;
            return (
              <button
                key={item.id}
                type="button"
                role="tab"
                id={`answers-tab-${item.id}`}
                className={`hall-day-chip ${active ? "is-active" : ""}`}
                aria-selected={active}
                aria-controls="answers-panel"
                onClick={() => {
                  setGroupId(item.id);
                  setOpenId(null);
                }}
              >
                {item.label}
              </button>
            );
          })}
        </div>
        <div id="answers-panel" role="tabpanel" aria-labelledby={`answers-tab-${group.id}`} className="mt-8 space-y-2">
          {group.items.map((item) => {
            const open = openId === item.id;
            return (
              <div key={item.id} className="faq-item" data-open={open || undefined}>
                <button
                  type="button"
                  className="faq-item-q"
                  aria-expanded={open}
                  onClick={() => setOpenId(open ? null : item.id)}
                >
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
