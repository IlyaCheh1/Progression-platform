"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import AppLogo from "@/components/app-logo";
import { AudienceToggle } from "@/components/audience-toggle";
import { useAudience } from "@/hooks/landing/useAudience";
import { useHeroVisible } from "@/hooks/landing/useHeroVisible";
import { useMobileMedia } from "@/hooks/landing/useMobileMedia";
import { isLandingPath, publicNavForAudience, withAudience } from "@/lib/audience";
import { KIDS_WUSHU } from "@/lib/landing/kids-wushu";

const NAV = [
  { title: "О нас", href: "/about" },
  { title: "Направления", href: "/#directions" },
  { title: "Тарифы", href: "/tariffs" },
  { title: "Акции", href: "/akcii" },
  { title: "Аренда зала", href: "/#arenda" },
  { title: "Контакты", href: "/contact" },
  { title: "FAQ", href: "/faq" },
] as const;

function MenuIcon({ open }: { open: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden className="text-white">
      {open ? (
        <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      ) : (
        <>
          <path d="M4 7h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          <path d="M4 12h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          <path d="M4 17h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </>
      )}
    </svg>
  );
}

export default function Header() {
  const isMobile = useMobileMedia();
  const pathname = usePathname();
  const router = useRouter();
  const { mode, isKids } = useAudience();
  const isHeroVisible = useHeroVisible();
  const overHero = isLandingPath(pathname) && isHeroVisible;
  const [menuOpen, setMenuOpen] = useState(false);
  const homeHref = withAudience("/", mode);
  const nav = publicNavForAudience(NAV, mode);

  useEffect(() => {
    if (!menuOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [menuOpen]);

  const go = (event: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    const resolved = withAudience(href, mode);
    const hashIndex = resolved.indexOf("#");
    const hash = hashIndex >= 0 ? resolved.slice(hashIndex) : "";
    const path = hashIndex >= 0 ? resolved.slice(0, hashIndex) : resolved;
    const isHomeHash = Boolean(hash) && isLandingPath(path);

    if (isHomeHash && isLandingPath(pathname)) {
      event.preventDefault();
      const target = document.querySelector<HTMLElement>(hash);
      if (!target) return;
      setMenuOpen(false);
      target.scrollIntoView({ behavior: "smooth", block: "start" });
      window.history.pushState(null, "", resolved);
      return;
    }

    if (menuOpen) setMenuOpen(false);
    if (isHomeHash && !isLandingPath(pathname)) {
      event.preventDefault();
      router.push(resolved);
    }
  };

  return (
    <>
      <header
        className="landing-header fixed left-0 right-0 top-0 z-50 flex min-h-[4.5rem] items-center md:min-h-[5.25rem]"
        data-over-hero={overHero || undefined}
        data-kids={isKids || undefined}
      >
        <Link href={homeHref} className="flex shrink-0 items-center" aria-label={isKids ? `${KIDS_WUSHU.school} — главная` : "Мастер меча — главная"}>
          <AppLogo size={isMobile ? 44 : 52} priority />
        </Link>

        <nav
          className="absolute left-1/2 hidden -translate-x-1/2 items-center gap-5 text-sm font-medium text-white/70 lg:flex xl:gap-7"
          aria-label="Основное меню"
        >
          {nav.map((link) => (
            <Link
              key={link.href}
              href={withAudience(link.href, mode)}
              className="uppercase transition-colors duration-200 hover:text-mos-amber"
              onClick={(event) => go(event, link.href)}
            >
              {link.title}
            </Link>
          ))}
        </nav>

        <div className="relative ml-auto flex items-center gap-2 sm:gap-3">
          <AudienceToggle />
          <button
            type="button"
            aria-label={menuOpen ? "Закрыть меню" : "Открыть меню"}
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((open) => !open)}
            className="flex h-11 w-11 shrink-0 items-center justify-center lg:hidden"
          >
            <MenuIcon open={menuOpen} />
          </button>
        </div>
      </header>

      {menuOpen && (
        <div id="mobile-public-menu" className="mobile-public-menu fixed inset-0 z-40 bg-void/95 backdrop-blur-md lg:hidden">
          <nav className="flex flex-col gap-2" aria-label="Мобильное меню">
            {nav.map((link) => (
              <Link
                key={link.href}
                href={withAudience(link.href, mode)}
                className="block py-3 text-base font-medium uppercase text-white/80 transition-colors duration-200 hover:text-mos-amber"
                onClick={(event) => go(event, link.href)}
              >
                {link.title}
              </Link>
            ))}
          </nav>
        </div>
      )}
    </>
  );
}
