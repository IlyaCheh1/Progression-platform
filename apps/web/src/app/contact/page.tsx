import type { Metadata } from "next";
import { ContactPage } from "@/components/contact-page";
import { DocPageShell } from "@/components/doc-page-shell";
import { LEGAL_ENTITY } from "@/lib/legal/content";
import "@/screens/landing/styles.css";

export const metadata: Metadata = {
  title: `Контакты — ${LEGAL_ENTITY.siteName}`,
  description: `Контакты ${LEGAL_ENTITY.brand}: реквизиты исполнителя, сообщество ВКонтакте и запись на занятия.`,
};

export default function ContactRoutePage() {
  return (
    <DocPageShell>
      <ContactPage />
    </DocPageShell>
  );
}
