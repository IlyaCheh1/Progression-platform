import type { Metadata } from "next";
import { notFound } from "next/navigation";
import CoursePage from "@/components/course-page";
import { COURSE_BY_SLUG, COURSES } from "@/lib/courses/data";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export function generateStaticParams() {
  return COURSES.map((course) => ({ slug: course.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const course = COURSE_BY_SLUG[slug];
  if (!course) return { title: "Курс — Мастер меча" };

  return {
    title: `${course.title} — Мастер меча`,
    description: course.metaDescription,
  };
}

export default async function CourseRoutePage({ params }: PageProps) {
  const { slug } = await params;
  const course = COURSE_BY_SLUG[slug];
  if (!course) notFound();

  return <CoursePage course={course} />;
}
