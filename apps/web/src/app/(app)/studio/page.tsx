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
import {
  fetchContentCatalog,
  fetchReleaseInfo,
  simulateQuest,
  validateContentCatalog,
  type ContentCatalog,
  type ReleaseInfo,
  type SimulationResult,
  type ValidationReport,
} from "@/lib/admin-content-api";
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
  | "schools"
  | "validation"
  | "simulation"
  | "release";

const TAB_META: { id: StudioTab; label: string; icon: ReactNode }[] = [
  { id: "overview", label: "Обзор", icon: <IconOverview className="h-5 w-5 shrink-0 md:h-6 md:w-6" /> },
  { id: "quests", label: "Квесты", icon: <IconQuest className="h-5 w-5 shrink-0 md:h-6 md:w-6" /> },
  { id: "achievements", label: "Ачивки", icon: <IconTrophy className="h-5 w-5 shrink-0 md:h-6 md:w-6" /> },
  { id: "talents", label: "Таланты", icon: <IconTalent className="h-5 w-5 shrink-0 md:h-6 md:w-6" /> },
  { id: "items", label: "Предметы", icon: <IconTrophy className="h-5 w-5 shrink-0 md:h-6 md:w-6" /> },
  { id: "rewards", label: "Награды", icon: <IconQuest className="h-5 w-5 shrink-0 md:h-6 md:w-6" /> },
  { id: "schools", label: "Школы", icon: <IconSchool className="h-5 w-5 shrink-0 md:h-6 md:w-6" /> },
  { id: "validation", label: "Validation", icon: <IconOverview className="h-5 w-5 shrink-0 md:h-6 md:w-6" /> },
  { id: "simulation", label: "Simulation", icon: <IconQuest className="h-5 w-5 shrink-0 md:h-6 md:w-6" /> },
  { id: "release", label: "Release", icon: <IconTrophy className="h-5 w-5 shrink-0 md:h-6 md:w-6" /> },
];

export default function StudioPage() {
  const router = useRouter();
  const [session, setSession] = useState<SessionUser | null>(null);
  const [tab, setTab] = useState<StudioTab>("overview");
  const [catalog, setCatalog] = useState<ContentCatalog | null>(null);
  const [validation, setValidation] = useState<ValidationReport | null>(null);
  const [simulation, setSimulation] = useState<SimulationResult | null>(null);
  const [release, setRelease] = useState<ReleaseInfo | null>(null);
  const [simQuestKey, setSimQuestKey] = useState("training.ready");
  const [simProgress, setSimProgress] = useState(1);

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
    void fetchContentCatalog(loaded).then(setCatalog).catch(() => setCatalog(null));
    void validateContentCatalog(loaded).then(setValidation).catch(() => undefined);
    void fetchReleaseInfo(loaded).then(setRelease).catch(() => undefined);

    const params = new URLSearchParams(window.location.search);
    const fromUrl = params.get("tab") as StudioTab | null;
    if (fromUrl && TAB_META.some((item) => item.id === fromUrl)) {
      setTab(fromUrl);
    }
  }, [router]);

  const live = catalog ?? {
    quests: content.quests,
    achievements: content.achievements,
    talents: content.talents,
    items: content.items,
    rewards: content.rewards,
    schools: content.schools,
  };

  const counts = useMemo(
    () => ({
      quests: live.quests.length,
      achievements: live.achievements.length,
      talents: live.talents.length,
      items: live.items.length,
      rewards: live.rewards.length,
      schools: live.schools.length,
    }),
    [live],
  );

  async function runSimulation() {
    if (!session) return;
    const res = await simulateQuest(session, simQuestKey, simProgress);
    setSimulation(res);
  }

  if (!session) {
    return <main className="grid min-h-[50vh] place-items-center text-mos-muted">Проверка доступа…</main>;
  }

  return (
    <main className="mx-auto mb-20 mt-0 flex w-full max-w-[960px] flex-col items-center gap-3 px-3 md:mt-11 md:mb-40 md:gap-6 md:px-4">
      <header className="bg-secondaryBg flex w-full flex-col gap-4 rounded-2xl p-4 backdrop-blur-[20px] md:flex-row md:items-end md:justify-between md:rounded-[32px] md:p-8">
        <div className="space-y-2">
          <p className="font-golos text-[10px] uppercase tracking-[0.18em] text-mos-amber md:text-xs">
            Контент-студия
          </p>
          <h1 className="font-display text-xl font-medium text-mos-text md:text-3xl">Каталог контента</h1>
          <p className="max-w-xl font-golos text-sm text-mos-muted">
            Live catalog из school-api + validation, simulation и release center.
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
              {live.quests.map((quest) => (
                <CatalogRow
                  key={quest.key}
                  title={quest.title}
                  meta={quest.key}
                  badge={quest.type}
                  value={`+${quest.xp} XP`}
                  description={quest.description}
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
              {live.achievements.map((item) => (
                <CatalogRow
                  key={item.key}
                  title={item.title}
                  meta={item.key}
                  badge={formatTiers(item.tiers)}
                  value={item.xp > 0 ? `+${item.xp} XP` : "—"}
                  description={item.description}
                />
              ))}
            </CatalogPanel>
          ) : null}

          {tab === "talents" ? (
            <CatalogPanel title="Таланты" subtitle="Узлы дерева способностей" count={counts.talents}>
              {live.talents.map((item) => (
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
              {live.items.map((item) => (
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
              {live.rewards.map((item) => (
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
              {live.schools.map((item) => (
                <CatalogRow
                  key={item.key}
                  title={item.title}
                  meta={item.key}
                  description={item.description}
                />
              ))}
            </CatalogPanel>
          ) : null}

          {tab === "validation" ? (
            <ValidationPanel report={validation} onRefresh={() => session && validateContentCatalog(session).then(setValidation)} />
          ) : null}

          {tab === "simulation" ? (
            <SimulationPanel
              questKey={simQuestKey}
              progress={simProgress}
              result={simulation}
              onQuestKeyChange={setSimQuestKey}
              onProgressChange={setSimProgress}
              onRun={() => void runSimulation()}
            />
          ) : null}

          {tab === "release" ? <ReleasePanel info={release} /> : null}
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

function ValidationPanel({ report, onRefresh }: { report: ValidationReport | null; onRefresh: () => void }) {
  return (
    <>
      <div className="flex items-center justify-between gap-3">
        <h2 className="font-display text-sm font-medium text-mos-text md:text-[17px]">Content validation</h2>
        <button type="button" onClick={onRefresh} className="og-btn og-btn-secondary og-btn-sm">
          Обновить
        </button>
      </div>
      {!report ? (
        <p className="font-golos text-sm text-mos-muted">Загрузка…</p>
      ) : (
        <>
          <p className={cn("font-golos text-sm", report.ok ? "text-green-400" : "text-red-400")}>
            {report.ok ? "Каталог прошёл validation" : "Есть ошибки validation"}
          </p>
          <ul className="max-h-[400px] space-y-2 overflow-auto">
            {report.issues.map((iss, i) => (
              <li key={i} className="rounded-xl border border-white/10 px-3 py-2 font-golos text-xs">
                <span className="uppercase text-mos-amber">{iss.level}</span> {iss.entity}/{iss.key}: {iss.message}
              </li>
            ))}
            {report.issues.length === 0 ? <li className="text-mos-muted">Issues не найдены</li> : null}
          </ul>
        </>
      )}
    </>
  );
}

function SimulationPanel({
  questKey,
  progress,
  result,
  onQuestKeyChange,
  onProgressChange,
  onRun,
}: {
  questKey: string;
  progress: number;
  result: SimulationResult | null;
  onQuestKeyChange: (v: string) => void;
  onProgressChange: (v: number) => void;
  onRun: () => void;
}) {
  return (
    <>
      <h2 className="font-display text-sm font-medium text-mos-text md:text-[17px]">Quest simulation</h2>
      <div className="flex flex-wrap gap-3">
        <input
          className="rounded-lg border border-white/10 bg-mos-bg px-3 py-2 font-golos text-sm"
          value={questKey}
          onChange={(e) => onQuestKeyChange(e.target.value)}
          placeholder="questKey"
        />
        <input
          type="number"
          className="w-24 rounded-lg border border-white/10 bg-mos-bg px-3 py-2 font-golos text-sm"
          value={progress}
          onChange={(e) => onProgressChange(Number(e.target.value))}
        />
        <button type="button" onClick={onRun} className="og-btn og-btn-primary og-btn-sm">
          Simulate
        </button>
      </div>
      {result ? (
        <p className="font-golos text-sm text-mos-muted">
          {result.explanation} · eligible={String(result.eligible)} · +{result.sampleXp} XP
        </p>
      ) : null}
    </>
  );
}

function ReleasePanel({ info }: { info: ReleaseInfo | null }) {
  if (!info) return <p className="text-mos-muted">Загрузка release info…</p>;
  const switches = Object.entries(info.killSwitches ?? {});
  return (
    <>
      <h2 className="font-display text-sm font-medium text-mos-text md:text-[17px]">Release center</h2>
      <p className="font-golos text-sm text-mos-muted">
        {info.bundleKey} v{info.bundleVersion} · status: {info.status}
      </p>
      <ul className="mt-4 space-y-2 font-golos text-xs">
        {switches.length === 0 ? <li className="text-mos-muted">Kill switches не активны</li> : null}
        {switches.map(([k, v]) => (
          <li key={k}>
            {k}: {v ? "ON" : "off"}
          </li>
        ))}
      </ul>
    </>
  );
}
