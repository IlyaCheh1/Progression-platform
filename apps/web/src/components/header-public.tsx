"use client";

import Link from "next/link";

export default function Header() {
  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-mos-line/40 bg-mos-bg/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <Link href="/" className="font-display text-lg tracking-[0.2em] text-mos-amber">
          MASTER OF SWORD
        </Link>
        <nav className="hidden gap-6 text-xs uppercase tracking-[0.16em] text-mos-muted md:flex">
          <a href="#directions">Направления</a>
          <a href="#services">Тренировки</a>
          <a href="#tariffs">Тарифы</a>
          <a href="#rpg">Персонаж</a>
        </nav>
        <Link href="/login" className="mos-btn text-xs">
          Войти
        </Link>
      </div>
    </header>
  );
}
