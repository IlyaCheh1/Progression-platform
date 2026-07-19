import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { LegalDocPage } from "@/components/legal-doc-page";
import { getLegalDocument, isLegalSlug, LEGAL_SLUGS } from "@/lib/legal/content";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export function generateStaticParams() {
  return LEGAL_SLUGS.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const doc = getLegalDocument(slug);
  if (!doc) return { title: "Документ не найден" };

  return {
    title: `${doc.title} — Мастер меча`,
    description: `${doc.title} школы исторического фехтования «Мастер меча».`,
  };
}

export default async function LegalSlugPage({ params }: PageProps) {
  const { slug } = await params;
  if (!isLegalSlug(slug)) notFound();

  const doc = getLegalDocument(slug);
  if (!doc) notFound();

  return <LegalDocPage doc={doc} />;
}
