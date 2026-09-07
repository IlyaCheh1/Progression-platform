import type { Metadata } from "next";
import { PublicPageShell } from "@/components/public-page-shell";
import { LANDING_FAQ } from "@/lib/landing/faq";
import { LEGAL_ENTITY } from "@/lib/legal/content";

export const metadata: Metadata = {
  title: `FAQ — ${LEGAL_ENTITY.siteName}`,
  description: "Частые вопросы о школе «Мастер меча»: возраст, форматы, запись и RPG-профиль.",
};

export default function FaqPage() {
  return (
    <PublicPageShell>
      <div className="mx-auto max-w-3xl">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-mos-amber">FAQ</p>
        <h1 className="mt-3 font-unbounded text-4xl text-white md:text-6xl">Вопросы и ответы</h1>
        <dl className="mt-10 space-y-8">
          {LANDING_FAQ.map((item) => (
            <div key={item.id}>
              <dt className="font-unbounded text-lg text-white">{item.question}</dt>
              <dd className="mt-2 text-sm leading-relaxed text-white/55">{item.answer}</dd>
            </div>
          ))}
        </dl>
      </div>
    </PublicPageShell>
  );
}
