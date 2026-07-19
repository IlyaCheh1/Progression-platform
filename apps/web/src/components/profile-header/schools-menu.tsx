"use client";

import { directions } from "@/lib/content";
import { getSchoolIconSrc, schoolMenuSubtitle } from "@/lib/school-icons";

type SchoolMenuItemProps = {
  title: string;
  subtitle: string;
  iconSrc: string;
};

function SchoolMenuItem({ title, subtitle, iconSrc }: SchoolMenuItemProps) {
  return (
    <button type="button" className="og-nav-popup-item">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={iconSrc} alt="" className="h-5 w-5 shrink-0 object-contain md:h-10 md:w-10" aria-hidden />
      <div className="flex min-w-0 flex-col md:gap-1">
        <span className="font-unbounded text-[8px] font-medium uppercase leading-3 tracking-wide text-primaryText md:text-[10px] md:leading-[14px]">
          {title}
        </span>
        <span className="truncate font-golos text-[8px] leading-3 text-[var(--color-additionalText)] md:text-xs md:leading-4">
          {subtitle}
        </span>
      </div>
    </button>
  );
}

export default function SchoolsMenu() {
  return (
    <div className="og-nav-popup-menu w-[140px] md:w-[248px]">
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
