"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { useAudience } from "@/hooks/landing/useAudience";
import { homeForAudience } from "@/lib/audience";

export function AudienceToggle() {
  const pathname = usePathname();
  const { mode } = useAudience();

  return (
    <div className="hero-audience-toggle" role="group" aria-label="Режим сайта">
      <Link
        href={homeForAudience("kids")}
        className="hero-audience-badge"
        data-active={mode === "kids" || undefined}
        aria-current={pathname === homeForAudience("kids") ? "page" : undefined}
      >
        Для детей
      </Link>
      <Link
        href={homeForAudience("adults")}
        className="hero-audience-badge"
        data-active={mode === "adults" || undefined}
        aria-current={pathname === homeForAudience("adults") ? "page" : undefined}
      >
        Для взрослых
      </Link>
    </div>
  );
}
