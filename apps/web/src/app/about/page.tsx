import type { Metadata } from "next";
import { AboutPage } from "@/components/about-page";
import { DocPageShell } from "@/components/doc-page-shell";
import { LEGAL_ENTITY } from "@/lib/legal/content";
import "@/screens/landing/styles.css";

export const metadata: Metadata = {
  title: `О нас — ${LEGAL_ENTITY.siteName}`,
  description: `Узнайте о ${LEGAL_ENTITY.brand}: историческое фехтование, школы оружия, RPG-прогресс и форматы занятий.`,
};

export default function AboutRoutePage() {
  return (
    <DocPageShell>
      <AboutPage />
    </DocPageShell>
  );
}
