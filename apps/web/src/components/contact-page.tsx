import { CONTACT_CONTENT } from "@/lib/contact/content";

export function ContactPage() {
  return (
    <>
      <h1>{CONTACT_CONTENT.title}</h1>
      <h2>{CONTACT_CONTENT.sectionHeading}</h2>
      {CONTACT_CONTENT.items.map((item) => (
        <p key={item.key}>
          {item.label}:{" "}
          {item.href ? (
            <a
              href={item.href}
              {...(item.external ? { target: "_blank", rel: "noopener noreferrer" } : undefined)}
            >
              {item.value}
            </a>
          ) : (
            <span className="text-white/90">{item.value}</span>
          )}
        </p>
      ))}
    </>
  );
}
