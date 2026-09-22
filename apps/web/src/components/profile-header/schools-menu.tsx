"use client";

import Link from "next/link";
import { directions } from "@/lib/content";
import { ADULT_COURSE_SLIDES, coursePageHref, type AdultCourseSlide } from "@/lib/landing/adult-directions";
import { getSchoolIconSrc, schoolMenuSubtitle } from "@/lib/school-icons";

type SchoolMenuItemProps = {
  title: string;
  subtitle: string;
  iconSrc: string;
  href?: string;
  cover?: boolean;
};

function sectionIcon(slide: AdultCourseSlide): string {
  if (slide.image && slide.key !== "witcher") return `/media/hero/${slide.image}`;
  return getSchoolIconSrc("witcher");
}

function SchoolMenuItem({ title, subtitle, iconSrc, href, cover = false }: SchoolMenuItemProps) {
  const className = "og-nav-popup-item no-underline";
  const body = (
    <>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={iconSrc}
        alt=""
        className={`h-5 w-5 shrink-0 rounded-md md:h-10 md:w-10 ${cover ? "object-cover" : "object-contain"}`}
        aria-hidden
      />
      <div className="flex min-w-0 flex-1 flex-col md:gap-1">
        <span className="font-unbounded text-[8px] font-medium uppercase leading-3 tracking-wide text-primaryText md:text-[10px] md:leading-[14px]">
          {title}
        </span>
        <span className="whitespace-normal font-golos text-[8px] leading-3 text-[var(--color-additionalText)] md:text-xs md:leading-4">
          {subtitle}
        </span>
      </div>
    </>
  );

  if (href) {
    return (
      <Link href={href} className={className}>
        {body}
      </Link>
    );
  }

  return (
    <button type="button" className={className}>
      {body}
    </button>
  );
}

export default function SchoolsMenu() {
  return (
    <div className="og-nav-popup-menu max-h-[70vh] w-[220px] overflow-y-auto md:w-[320px]">
      {ADULT_COURSE_SLIDES.map((section) => (
        <SchoolMenuItem
          key={section.key}
          title={section.title}
          subtitle={section.comingSoon ? "Скоро в наборе" : schoolMenuSubtitle(section.description)}
          iconSrc={sectionIcon(section)}
          href={coursePageHref(section.courseSlug)}
          cover={Boolean(section.image)}
        />
      ))}
      {directions.map((school) => (
        <SchoolMenuItem
          key={school.key}
          title={school.title}
          subtitle={schoolMenuSubtitle(school.description)}
          iconSrc={getSchoolIconSrc(school.key)}
        />
      ))}
    </div>
  );
}
