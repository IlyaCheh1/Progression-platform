"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Button from "@/components/ui/button";

const STORAGE_KEY = "mos-cookie-accepted";

const PUBLIC_PREFIXES = [
  "/kids",
  "/akcii",
  "/journal",
  "/about",
  "/contact",
  "/faq",
  "/tariffs",
  "/arenda",
  "/legal",
  "/courses",
];

export function showsCookieNotice(pathname: string): boolean {
  if (pathname === "/") return true;
  return PUBLIC_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}

export default function CookieNotice() {
  const pathname = usePathname() || "/";
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!showsCookieNotice(pathname)) {
      setVisible(false);
      return;
    }
    try {
      setVisible(window.localStorage.getItem(STORAGE_KEY) !== "accepted");
    } catch {
      setVisible(true);
    }
  }, [pathname]);

  if (!visible) return null;

  const accept = () => {
    try {
      window.localStorage.setItem(STORAGE_KEY, "accepted");
    } catch {
      // Storage can be blocked. Hide the bar for this view anyway.
    }
    setVisible(false);
  };

  return (
    <div className="cookie-notice" role="dialog" aria-label="Уведомление о cookies">
      <p>
        Сайт использует файлы cookies. Подробнее — в{" "}
        <Link href="/legal/privacy">политике конфиденциальности</Link>.
      </p>
      <Button type="button" variant="primary" size="sm" data-cookie-accept onClick={accept}>
        Принять
      </Button>
    </div>
  );
}
