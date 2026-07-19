"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import AppLogo from "@/components/app-logo";
import Button from "@/components/ui/button";
import { useHeroVisible } from "@/hooks/landing/useHeroVisible";
import { useMobileMedia } from "@/hooks/landing/useMobileMedia";
import { cn } from "@/lib/utils";

const NAV = [
  { title: "Направления", href: "#directions" },
  { title: "Тренировки", href: "#services" },
  { title: "Тарифы", href: "#tariffs" },
  { title: "Персонаж", href: "#rpg" },
] as const;

const mobileActionTransition = "transition-all duration-300 ease-out motion-reduce:transition-none";

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
  const isHeroVisible = useHeroVisible();
  const [menuOpen, setMenuOpen] = useState(false);

  const showDesktopNav = isHeroVisible;
  const showMobileMenuButton = isMobile && isHeroVisible;
  const showLoginButton = !isMobile || !isHeroVisible;
  const showMobileOverlay = isMobile && menuOpen && isHeroVisible;

  useEffect(() => {
    if (!isHeroVisible) setMenuOpen(false);
  }, [isHeroVisible]);

  useEffect(() => {
    if (!menuOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [menuOpen]);

  const navigateToSection = (event: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    event.preventDefault();
    const target = document.querySelector<HTMLElement>(href);
    if (!target) return;
    const jump = () => {
      const root = document.documentElement;
      const previousScrollBehavior = root.style.scrollBehavior;
      root.style.scrollBehavior = "auto";
      target.scrollIntoView({ behavior: "auto", block: "start" });
      window.history.pushState(null, "", href);
      window.requestAnimationFrame(() => {
        root.style.scrollBehavior = previousScrollBehavior;
      });
    };
    if (menuOpen) {
      setMenuOpen(false);
      window.requestAnimationFrame(jump);
      return;
    }
    jump();
  };

  return (
    <>
      <header
        className="fixed left-0 right-0 top-0 z-50 flex min-h-[4.5rem] items-center py-3 pl-6 pr-4 md:min-h-[5.25rem] md:px-6 md:py-4"
        style={{ background: "linear-gradient(to bottom, rgba(11,11,12,0.95), transparent)" }}
      >
        <Link href="/" className="flex shrink-0 items-center" aria-label="Мастер меча — главная">
          <AppLogo size={isMobile ? 44 : 52} priority />
        </Link>

        <nav
          className={cn(
            "absolute left-1/2 hidden -translate-x-1/2 items-center gap-8 text-sm font-medium text-white/60 transition-all duration-300 md:flex",
            showDesktopNav ? "pointer-events-auto translate-y-0 opacity-100" : "pointer-events-none -translate-y-2 opacity-0",
          )}
          aria-hidden={!showDesktopNav}
        >
          {NAV.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="uppercase transition-colors duration-200 hover:text-mos-amber"
              onClick={(event) => navigateToSection(event, link.href)}
            >
              {link.title}
            </a>
          ))}
        </nav>

        <div className="relative ml-auto flex items-center gap-2">
          <div className="relative h-11 min-w-11 md:min-w-[100px]">
            <button
              type="button"
              aria-label={menuOpen ? "Закрыть меню" : "Открыть меню"}
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen((open) => !open)}
              className={cn(
                "absolute inset-0 flex items-center justify-center md:hidden",
                mobileActionTransition,
                showMobileMenuButton ? "pointer-events-auto scale-100 opacity-100" : "pointer-events-none scale-90 opacity-0",
              )}
            >
              <MenuIcon open={menuOpen} />
            </button>
            <div
              className={cn(
                "absolute inset-0 flex items-center justify-end",
                mobileActionTransition,
                showLoginButton ? "pointer-events-auto scale-100 opacity-100" : "pointer-events-none scale-90 opacity-0",
              )}
            >
              <Button href="/login" variant="primary" size="md" className="uppercase">
                Войти
              </Button>
            </div>
          </div>
        </div>
      </header>

      {showMobileOverlay && (
        <div id="mobile-hero-menu" className="fixed inset-0 z-40 bg-void/95 px-6 pt-28 backdrop-blur-md md:hidden">
          <nav className="flex flex-col gap-2">
            {NAV.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="block py-3 text-base font-medium uppercase text-white/80 transition-colors duration-200 hover:text-mos-amber"
                onClick={(event) => navigateToSection(event, link.href)}
              >
                {link.title}
              </a>
            ))}
            <Button href="/login" variant="magenta" size="lg" className="mt-4 uppercase">
              Войти
            </Button>
          </nav>
        </div>
      )}
    </>
  );
}
