import { ABOUT_CONTENT } from "@/lib/about/content";

export function AboutPage() {
  const sections = [...ABOUT_CONTENT.schoolSections, ...ABOUT_CONTENT.platformSections];

  return (
    <>
      <h1>{ABOUT_CONTENT.title}</h1>
      {ABOUT_CONTENT.intro.map((paragraph) => (
        <p key={paragraph}>{paragraph}</p>
      ))}
      <h2>{ABOUT_CONTENT.ecosystemHeading}</h2>
      {sections.map((section) => (
        <section key={section.key}>
          <h3>{section.title}</h3>
          <p>{section.description}</p>
        </section>
      ))}
    </>
  );
}
