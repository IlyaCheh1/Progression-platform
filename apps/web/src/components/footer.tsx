import Link from "next/link";

const links = [
  { href: "/legal/offer", label: "Публичная оферта" },
  { href: "/legal/terms", label: "Пользовательское соглашение" },
  { href: "/legal/privacy", label: "Политика конфиденциальности" },
  { href: "/legal/cookies", label: "Политика cookies" },
];

export default function Footer() {
  return (
    <footer className="border-t border-mos-line/40 bg-mos-bg py-12">
      <div className="mx-auto flex max-w-6xl flex-col gap-8 px-4 md:flex-row md:justify-between">
        <div>
          <p className="font-display tracking-[0.2em] text-mos-amber">MASTER OF SWORD</p>
          <p className="mt-2 max-w-sm text-sm text-mos-muted">
            Школа фехтования и Progression Platform. Тренировки, мастерство клинка и RPG-профиль ученика.
          </p>
        </div>
        <div className="flex flex-col gap-2 text-sm text-mos-muted">
          {links.map((l) => (
            <Link key={l.href} href={l.href} className="hover:text-mos-amber">
              {l.label}
            </Link>
          ))}
        </div>
      </div>
      <div className="mos-line mx-auto mt-8 max-w-6xl" />
      <p className="mx-auto mt-4 max-w-6xl px-4 text-xs text-mos-muted">© {new Date().getFullYear()} Master of Sword</p>
    </footer>
  );
}
