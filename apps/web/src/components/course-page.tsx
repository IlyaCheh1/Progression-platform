import Image from "next/image";
import Link from "next/link";
import Button from "@/components/ui/button";
import CourseFaqSection from "@/components/course-faq-section";
import type { CourseContent } from "@/lib/courses/types";

type CoursePageProps = {
  course: CourseContent;
};

export default function CoursePage({ course }: CoursePageProps) {
  const accent = course.accentColor;

  return (
    <main className="mx-auto max-w-3xl px-4 py-12 md:px-6 md:py-16">
      <Link href="/" className="text-sm text-mos-amber transition-colors hover:text-mos-amber-hot">
        ← На главную
      </Link>

      <header className="mt-8">
        <p className="text-xs font-semibold uppercase tracking-[0.2em]" style={{ color: accent }}>
          {course.subtitle}
        </p>
        <h1 className="mt-3 font-unbounded text-3xl font-medium leading-tight text-mos-text md:text-4xl">
          {course.title}
        </h1>

        {course.heroImage ? (
          <div className="relative mt-6 aspect-[16/10] overflow-hidden rounded-2xl border border-mos-line/50">
            <Image
              src={course.heroImage}
              alt={course.title}
              fill
              priority
              sizes="(max-width: 768px) 100vw, 768px"
              className="object-cover"
            />
            <div
              className="pointer-events-none absolute inset-0"
              style={{
                background: `linear-gradient(to top, rgba(11,11,12,0.55), transparent 45%)`,
              }}
            />
          </div>
        ) : null}

        <div className="mos-line my-6" />

        {course.quote ? (
          <blockquote className="border-l-2 pl-4 italic text-mos-muted" style={{ borderColor: `${accent}99` }}>
            <p className="leading-relaxed">&ldquo;{course.quote.text}&rdquo;</p>
            <footer className="mt-3 text-sm not-italic text-mos-text/70">— {course.quote.author}</footer>
          </blockquote>
        ) : null}
      </header>

      <section className="mt-12">
        <h2 className="font-unbounded text-xl text-mos-text">{course.intro.heading}</h2>
        <div className="mt-4 space-y-4 leading-relaxed text-mos-muted">
          {course.intro.body.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
        </div>

        {course.intro.highlights?.length ? (
          <div className="mt-8">
            {course.intro.highlightsHeading ? (
              <h3 className="font-unbounded text-lg text-mos-text">{course.intro.highlightsHeading}</h3>
            ) : null}
            <div className="mt-4 space-y-4">
              {course.intro.highlights.map((item) => (
                <div
                  key={item.title}
                  className="rounded-2xl border border-mos-line/40 bg-mos-stone/30 p-5"
                >
                  <h4 className="font-medium text-mos-text">{item.title}</h4>
                  <p className="mt-2 text-sm leading-relaxed text-mos-muted">{item.text}</p>
                </div>
              ))}
            </div>
          </div>
        ) : null}

        {course.instructor ? (
          <div
            className="mt-8 rounded-2xl border border-mos-line/40 bg-mos-stone/30 p-5"
          >
            <h3 className="font-unbounded text-sm uppercase tracking-[0.12em] text-mos-text">
              Преподаватель курса
            </h3>
            <p className="mt-2 font-medium text-mos-text">{course.instructor.name}</p>
            <p className="mt-1 text-sm text-mos-muted">{course.instructor.note}</p>
          </div>
        ) : null}
      </section>

      <section className="mt-12">
        <h2 className="font-unbounded text-xl text-mos-text">{course.program.heading}</h2>
        <p className="mt-4 leading-relaxed text-mos-muted">{course.program.summary}</p>

        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          {course.schedule.map((group) => (
            <div
              key={group.location}
              className="rounded-2xl border border-mos-line/60 bg-mos-stone/40 p-5"
            >
              <h3 className="font-unbounded text-sm uppercase tracking-[0.12em]" style={{ color: accent }}>
                {group.location}
              </h3>
              <ul className="mt-3 space-y-2 text-sm text-mos-muted">
                {group.slots.map((slot) => (
                  <li key={slot}>{slot}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-8 space-y-4">
          {course.program.levels.map((level) => (
            <div
              key={level.title}
              className="rounded-2xl border border-mos-line/40 bg-mos-bg-elevated/50 p-5"
            >
              <h3 className="font-medium text-mos-text">{level.title}</h3>
              <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-mos-muted">
                {level.items.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <p className="mt-8 leading-relaxed text-mos-muted">{course.program.lessonNote}</p>
        <p className="mt-4 text-sm text-mos-text/60">Длительность занятия: {course.program.duration} часа.</p>
      </section>

      <div className="relative left-1/2 mt-12 w-screen max-w-[100vw] -translate-x-1/2 px-4 md:px-6">
        <CourseFaqSection accentColor={accent} items={course.faq} />
      </div>

      <section
        className="mt-14 rounded-2xl border p-6 md:p-8"
        style={{
          borderColor: `${accent}4D`,
          backgroundColor: `${accent}1A`,
        }}
      >
        <h2 className="font-unbounded text-xl text-mos-text">Записаться на курс</h2>
        <p className="mt-3 text-sm leading-relaxed text-mos-muted">
          Оформите запись через сообщество школы или посмотрите тарифы на главной странице.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <a
            href={course.links.enroll}
            target="_blank"
            rel="noopener noreferrer"
            className="og-btn og-btn-primary og-btn-md uppercase"
          >
            Записаться
          </a>
          <a
            href={course.links.masters}
            target="_blank"
            rel="noopener noreferrer"
            className="og-btn og-btn-secondary og-btn-md uppercase"
          >
            Мастера школы
          </a>
          <Button href="/#tariffs" variant="stroke" size="md" className="uppercase">
            Тарифы
          </Button>
        </div>
        <p className="mt-4 text-xs text-mos-muted/80">
          <a
            href={course.links.community}
            target="_blank"
            rel="noopener noreferrer"
            className="text-mos-amber underline-offset-4 hover:underline"
          >
            {course.links.communityLabel}
          </a>
        </p>
      </section>
    </main>
  );
}
