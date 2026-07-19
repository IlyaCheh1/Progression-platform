"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import SideBar from "@/components/side-bar";
import {
  IconOverview,
  IconQuest,
  IconSchool,
  IconTalent,
  IconTrophy,
} from "@/components/studio/studio-icons";
import { content } from "@/lib/content";
import { routes } from "@/lib/routes";
import { isAdminPrincipal, loadSession, type SessionUser } from "@/lib/session";
import { cn } from "@/lib/utils";

type StudioTab =
  | "overview"
  | "quests"
  | "achievements"
  | "talents"
  | "items"
  | "rewards"
  | "schools";

const TAB_META: { id: StudioTab; label: string; icon: ReactNode }[] = [
  { id: "overview", label: "Обзор", icon: <IconOverview className="h-5 w-5 shrink-0 md:h-6 md:w-6" /> },
  { id: "quests", label: "Квесты", icon: <IconQuest className="h-5 w-5 shrink-0 md:h-6 md:w-6" /> },
  { id: "achievements", label: "Ачивки", icon: <IconTrophy className="h-5 w-5 shrink-0 md:h-6 md:w-6" /> },
  { id: "talents", label: "Таланты", icon: <IconTalent className="h-5 w-5 shrink-0 md:h-6 md:w-6" /> },
  { id: "items", label: "Предметы", icon: <IconTrophy className="h-5 w-5 shrink-0 md:h-6 md:w-6" /> },
  { id: "rewards", label: "Награды", icon: <IconQuest className="h-5 w-5 shrink-0 md:h-6 md:w-6" /> },
  { id: "schools", label: "Школы", icon: <IconSchool className="h-5 w-5 shrink-0 md:h-6 md:w-6" /> },
];

export default function StudioPage() {
  const router = useRouter();
  const [session, setSession] = useState<SessionUser | null>(null);
  const [tab, setTab] = useState<StudioTab>("overview");

  useEffect(() => {
    const loaded = loadSession();
    if (!loaded) {
      router.replace("/login");
      return;
    }
    if (!isAdminPrincipal(loaded.roles)) {
      router.replace("/profile");
      return;
    }
    setSession(loaded);

    const params = new URLSearchParams(window.location.search);
    const fromUrl = params.get("tab") as StudioTab | null;
    if (fromUrl && TAB_META.some((item) => item.id === fromUrl)) {
      setTab(fromUrl);
    }
  }, [router]);

  const counts = useMemo(
    () => ({
      quests: content.quests.length,
      achievements: content.achievements.length,
      talents: content.talents.length,
      items: content.items.length,
      rewards: content.rewards.length,
      schools: content.schools.length,
    }),
    [],
  );

  if (!session) {
    return <main className="grid min-h-[50vh] place-items-center text-mos-muted">Проверка доступа…</main>;
  }

  return (
    <main className="mx-auto mb-20 mt-3 flex w-full max-w-[960px] flex-col items-center gap-3 px-3 md:mt-11 md:mb-40 md:gap-6 md:px-4">
      <header className="bg-secondaryBg flex w-full flex-col gap-4 rounded-2xl p-4 backdrop-blur-[20px] md:flex-row md:items-end md:justify-between md:rounded-[32px] md:p-8">
        <div className="space-y-2">
          <p className="font-golos text-[10px] uppercase tracking-[0.18em] text-mos-amber md:text-xs">
            Partner Content Studio
          </p>
          <h1 className="font-display text-xl font-medium text-mos-text md:text-3xl">Каталог контента</h1>
          <p className="max-w-xl font-golos text-sm text-mos-muted">
            Read-only просмотр starter bundle. Создание и правка — в authoring-контуре админки.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/admin/content" className="og-btn og-btn-primary og-btn-md uppercase">
            Authoring
          </Link>
          <Link href={routes.admin} className="og-btn og-btn-secondary og-btn-md uppercase">
            Админка
          </Link>
        </div>
      </header>

      <div className="flex w-full flex-col items-start gap-3 md:flex-row md:gap-6">
        <SideBar
          items={TAB_META}
          activeId={tab}
          onChange={(id) => setTab(id as StudioTab)}
          syncUrlParam="tab"
          footer={
            <p className="font-golos text-[10px] leading-relaxed text-mos-muted md:text-xs">
              Publish / validation / simulation — только через API. Hardcode seed в обход validation запрещён.
            </p>
          }
        />

        <section className="bg-secondaryBg flex min-h-[360px] w-full flex-col gap-4 rounded-2xl p-4 backdrop-blur-[20px] md:gap-6 md:rounded-[32px] md:p-8">
          {tab === "overview" ? <OverviewPanel counts={counts} onOpen={setTab} /> : null}

          {tab === "quests" ? (
            <CatalogPanel
              title="Квесты"
              subtitle="Онбординг, daily / weekly / monthly задания starter pack"
              count={counts.quests}
            >
              {content.quests.map((quest) => (
                <CatalogRow
                  key={quest.key}
                  title={quest.title}
                  meta={quest.key}
                  badge={quest.type}
                  value={`+${quest.xp} XP`}
                />
              ))}
            </CatalogPanel>
          ) : null}

          {tab === "achievements" ? (
            <CatalogPanel
              title="Ачивки"
              subtitle="Достижения и тиры прогресса"
              count={counts.achievements}
            >
              {content.achievements.map((item) => (
                <CatalogRow
                  key={item.key}
                  title={item.title}
                  meta={item.key}
                  badge={formatTiers(item.tiers)}
                  value={item.xp > 0 ? `+${item.xp} XP` : "—"}
                />
              ))}
            </CatalogPanel>
          ) : null}

          {tab === "talents" ? (
            <CatalogPanel title="Таланты" subtitle="Узлы дерева способностей" count={counts.talents}>
              {content.talents.map((item) => (
                <CatalogRow
                  key={item.key}
                  title={item.title}
                  meta={item.key}
                  badge={`Rank ${item.rank}`}
                />
              ))}
            </CatalogPanel>
          ) : null}

          {tab === "items" ? (
            <CatalogPanel
              title="Предметы"
              subtitle="Аватары, рамки, баннеры, темы, титулы и коллекционные"
              count={counts.items}
            >
              {content.items.map((item) => (
                <CatalogRow
                  key={item.key}
                  title={item.title}
                  meta={item.key}
                  badge={item.category}
                  value={item.type}
                />
              ))}
            </CatalogPanel>
          ) : null}

          {tab === "rewards" ? (
            <CatalogPanel title="Наградные наборы" subtitle="Reward bundles из content-pack" count={counts.rewards}>
              {content.rewards.map((item) => (
                <CatalogRow
                  key={item.key}
                  title={item.title}
                  meta={item.key}
                  description={item.components}
                />
              ))}
            </CatalogPanel>
          ) : null}

          {tab === "schools" ? (
            <CatalogPanel title="Школы" subtitle="Направления мастерства" count={counts.schools}>
              {content.schools.map((item) => (
                <CatalogRow
                  key={item.key}
                  title={item.title}
                  meta={item.key}
                  description={item.description}
                />
              ))}
            </CatalogPanel>
          ) : null}
        </section>
      </div>
    </main>
  );
}

function OverviewPanel({
  counts,
  onOpen,
}: {
  counts: Record<"quests" | "achievements" | "talents" | "items" | "rewards" | "schools", number>;
  onOpen: (tab: StudioTab) => void;
}) {
  const cards: { id: StudioTab; label: string; count: number; hint: string }[] = [
    { id: "quests", label: "Квесты", count: counts.quests, hint: "Задания пути и тренировок" },
    { id: "achievements", label: "Ачивки", count: counts.achievements, hint: "Награды и тиры" },
    { id: "talents", label: "Таланты", count: counts.talents, hint: "Узлы дерева" },
    { id: "items", label: "Предметы", count: counts.items, hint: "Косметика и коллекционные" },
    { id: "rewards", label: "Награды", count: counts.rewards, hint: "Reward bundles" },
    { id: "schools", label: "Школы", count: counts.schools, hint: "Курсы MoS" },
  ];

  return (
    <>
      <div className="space-y-2">
        <h2 className="font-display text-sm font-medium text-mos-text md:text-[17px]">Обзор bundle</h2>
        <p className="font-golos text-sm text-mos-muted">
          Сводка starter content pack. Выберите раздел, чтобы просмотреть элементы каталога.
        </p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        {cards.map((card) => (
          <button
            key={card.id}
            type="button"
            onClick={() => onOpen(card.id)}
            className={cn(
              "rounded-2xl border border-white/10 bg-mos-bg/40 p-4 text-left transition-colors",
              "hover:border-mos-amber/50 hover:bg-white/5 md:rounded-[24px] md:p-5",
            )}
          >
            <div className="flex items-center justify-between gap-2">
              <h3 className="font-display text-sm text-mos-text md:text-[15px]">{card.label}</h3>
              <span className="rounded-xl bg-mos-bg px-2 py-0.5 font-display text-sm text-mos-amber">
                {card.count}
              </span>
            </div>
            <p className="mt-2 font-golos text-xs text-mos-muted md:text-sm">{card.hint}</p>
          </button>
        ))}
      </div>
    </>
  );
}

function CatalogPanel({
  title,
  subtitle,
  count,
  children,
}: {
  title: string;
  subtitle: string;
  count: number;
  children: ReactNode;
}) {
  return (
    <>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-1">
          <h2 className="font-display text-sm font-medium text-mos-text md:text-[17px]">{title}</h2>
          <p className="font-golos text-sm text-mos-muted">{subtitle}</p>
        </div>
        <span className="rounded-xl bg-mos-bg px-3 py-1 font-display text-xs text-mos-amber md:text-sm">
          {count}
        </span>
      </div>
      <ul className="flex max-h-[520px] flex-col gap-2 overflow-auto pr-1">{children}</ul>
    </>
  );
}

function CatalogRow({
  title,
  meta,
  badge,
  value,
  description,
}: {
  title: string;
  meta: string;
  badge?: string;
  value?: string;
  description?: string;
}) {
  return (
    <li className="rounded-2xl border border-white/10 bg-mos-bg/35 px-3 py-3 md:rounded-[20px] md:px-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0 space-y-1">
          <p className="font-display text-xs text-mos-text md:text-sm">{title}</p>
          <p className="truncate font-golos text-[10px] text-mos-muted md:text-xs">{meta}</p>
          {description ? <p className="font-golos text-xs text-mos-muted md:text-sm">{description}</p> : null}
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1">
          {badge ? (
            <span className="rounded-lg bg-white/5 px-2 py-0.5 font-golos text-[10px] uppercase tracking-wide text-mos-muted">
              {badge}
            </span>
          ) : null}
          {value ? <span className="font-display text-[10px] text-mos-amber md:text-xs">{value}</span> : null}
        </div>
      </div>
    </li>
  );
}

function formatTiers(tiers: number | number[]): string {
  if (Array.isArray(tiers)) return `${tiers.length} tiers`;
  return tiers === 1 ? "1 tier" : `${tiers} tiers`;
}
