import Link from "next/link";
import AppLogo from "@/components/app-logo";
import { LEGAL_ENTITY } from "@/lib/legal/content";

const SOCIAL_ICONS = {
  telegram: (
    <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24" aria-hidden>
      <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
    </svg>
  ),
  vk: (
    <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24" aria-hidden>
      <path d="M15.684 0H8.316C1.592 0 0 1.592 0 8.316v7.368C0 22.408 1.592 24 8.316 24h7.368C22.408 24 24 22.408 24 15.684V8.316C24 1.592 22.408 0 15.684 0zm3.692 17.123h-1.744c-.66 0-.862-.525-2.049-1.714-1.033-1-1.49-1.135-1.744-1.135-.356 0-.458.102-.458.593v1.575c0 .424-.135.678-1.253.678-1.846 0-3.896-1.118-5.335-3.202C4.624 10.857 4.03 8.57 4.03 8.096c0-.254.102-.491.593-.491h1.744c.44 0 .61.203.78.677.863 2.49 2.303 4.675 2.896 4.675.22 0 .322-.102.322-.66V9.721c-.068-1.186-.695-1.287-.695-1.71 0-.203.17-.407.44-.407h2.744c.373 0 .508.203.508.643v3.473c0 .372.17.508.271.508.22 0 .407-.136.813-.542 1.254-1.406 2.151-3.574 2.151-3.574.119-.254.322-.491.763-.491h1.744c.525 0 .644.271.525.643-.22 1.017-2.354 4.031-2.354 4.031-.186.305-.254.44 0 .78.186.254.796.779 1.203 1.253.745.847 1.32 1.558 1.473 2.049.17.49-.085.744-.576.744z" />
    </svg>
  ),
} as const;

const FOOTER_LINKS = [
  { title: "О нас", href: "/about" },
  { title: "Контакты", href: "/contact" },
  { title: "Публичная оферта", href: "/legal/offer" },
  { title: "Пользовательское соглашение", href: "/legal/terms" },
  { title: "Политика конфиденциальности", href: "/legal/privacy" },
  { title: "Политика cookies", href: "/legal/cookies" },
] as const;

const SOCIAL_LINKS = [
  { label: "Telegram", href: "#", icon: SOCIAL_ICONS.telegram },
  { label: "ВКонтакте", href: LEGAL_ENTITY.vkUrl, icon: SOCIAL_ICONS.vk },
] as const;

function AccentBar() {
  return (
    <span
      className="inline-block h-3 w-0.5 min-w-0.5 rounded-full"
      style={{ background: "var(--yellow)" }}
      aria-hidden
    />
  );
}

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="landing-footer relative z-10 text-white">
      <div className="mx-auto max-w-6xl px-6 pb-10">
        <div className="flex flex-col gap-6 md:flex-row md:items-start md:gap-10">
          <Link href="/" aria-label="Мастер меча — главная" className="flex shrink-0 items-center">
            <AppLogo size={84} />
          </Link>

          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2 text-sm text-white/70">
              <AccentBar />
              <span>Мастер меча — школа исторического фехтования</span>
            </div>
            <div className="flex max-w-3xl flex-col gap-3 text-[calc(0.875rem-2pt)] text-white/55 md:text-sm">
              <p>
                Мастер меча объединяет тренировки по историческому фехтованию и Progression Platform: групповые и
                индивидуальные занятия, несколько школ оружия и единый RPG-профиль ученика.
              </p>
              <p>
                Записывайся на пробное занятие, выбирай направление и абонемент, прокачивай персонажа через тренировки
                и достижения. Развивай мастерство клинка в сообществе единомышленников!
              </p>
            </div>
          </div>
        </div>

        <div
          className="mt-10 flex flex-wrap gap-x-6 gap-y-3 border-t pt-6"
          style={{ borderColor: "rgba(255,255,255,0.1)" }}
        >
          {FOOTER_LINKS.map((item) => (
            <Link
              key={item.title}
              href={item.href}
              className="flex items-center gap-2 text-sm text-white/55 underline-offset-4 transition-colors duration-150 hover:text-white hover:underline"
            >
              <AccentBar />
              {item.title}
            </Link>
          ))}
        </div>

        <div
          className="mt-8 flex flex-col gap-4 border-t pt-6 sm:flex-row sm:items-center sm:justify-between"
          style={{ borderColor: "rgba(255,255,255,0.1)" }}
        >
          <span className="text-sm text-white/45">
            © {year} Школа исторического фехтования «Мастер меча». Все права защищены.
          </span>

          <div className="flex items-center gap-3">
            {SOCIAL_LINKS.map((social) => (
              <a
                key={social.label}
                href={social.href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={social.label}
                className="flex h-9 w-9 items-center justify-center rounded-full border text-white/50 transition-all duration-200 hover:border-white/30 hover:text-white"
                style={{ borderColor: "rgba(255,255,255,0.12)" }}
              >
                {social.icon}
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
