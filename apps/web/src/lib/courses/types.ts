export type CourseFaqItem = {
  question: string;
  answer: string;
  list?: readonly string[];
  extra?: string;
};

export type CourseHighlight = {
  title: string;
  text: string;
};

export type CourseContent = {
  slug: string;
  schoolKey: string;
  path: string;
  title: string;
  subtitle: string;
  accentColor: string;
  metaDescription: string;
  heroImage?: string;
  quote?: { text: string; author: string };
  intro: {
    heading: string;
    body: readonly string[];
    highlightsHeading?: string;
    highlights?: readonly CourseHighlight[];
  };
  instructor?: {
    name: string;
    note: string;
  };
  program: {
    heading: string;
    summary: string;
    lessonNote: string;
    duration: string;
    levels: readonly { title: string; items: readonly string[] }[];
  };
  schedule: readonly { location: string; slots: readonly string[] }[];
  faq: readonly CourseFaqItem[];
  links: {
    enroll: string;
    masters: string;
    community: string;
    communityLabel: string;
  };
};
