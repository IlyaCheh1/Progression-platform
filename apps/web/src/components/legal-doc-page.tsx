import Link from "next/link";
import type { LegalDocument } from "@/lib/legal/content";

type LegalDocPageProps = {
  doc: LegalDocument;
};

export function LegalDocPage({ doc }: LegalDocPageProps) {
  return (
    <main className="mx-auto max-w-3xl px-4 py-16 md:px-6">
      <Link href="/" className="text-sm text-mos-amber transition-colors hover:text-mos-text">
        ← На главную
      </Link>

      <h1 className="mt-6 font-unbounded text-3xl text-mos-text md:text-4xl">{doc.title}</h1>
      <p className="mt-2 text-sm text-mos-muted">Редакция от {doc.updatedAt}</p>

      <div className="mos-line my-8" />

      {doc.preamble?.map((paragraph) => (
        <p key={paragraph} className="mb-4 text-mos-muted leading-relaxed">
          {paragraph}
        </p>
      ))}

      <div className="space-y-8">
        {doc.sections.map((section) => (
          <section key={section.heading}>
            <h2 className="mb-3 font-unbounded text-lg text-mos-text md:text-xl">{section.heading}</h2>
            {section.paragraphs?.map((paragraph) => (
              <p key={paragraph} className="mb-3 text-mos-muted leading-relaxed">
                {paragraph}
              </p>
            ))}
            {section.list ? (
              <ul className="list-disc space-y-2 pl-5 text-mos-muted leading-relaxed">
                {section.list.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            ) : null}
          </section>
        ))}
      </div>
    </main>
  );
}
