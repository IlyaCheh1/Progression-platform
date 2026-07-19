"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import SideBar from "@/components/side-bar";
import FormField from "@/components/ui/form-field";
import Input from "@/components/ui/input";
import SelectField from "@/components/ui/select-field";
import Textarea from "@/components/ui/textarea";
import {
  deleteContentEntity,
  fetchContentCatalog,
  upsertContentEntity,
  type ContentCatalog,
  type ContentEntity,
} from "@/lib/admin-content-api";
import { loadSession, type SessionUser } from "@/lib/session";
import { cn } from "@/lib/utils";

type TabId = "quests" | "achievements" | "talents" | "items" | "titles" | "rewards" | "schools";

const TABS: { id: TabId; label: string }[] = [
  { id: "quests", label: "Задания" },
  { id: "achievements", label: "Ачивки" },
  { id: "talents", label: "Таланты" },
  { id: "items", label: "Предметы" },
  { id: "titles", label: "Титулы" },
  { id: "rewards", label: "Награды" },
  { id: "schools", label: "Школы" },
];

const QUEST_TYPES = [
  { value: "ONBOARDING", label: "Онбординг" },
  { value: "DAILY", label: "Дневное" },
  { value: "WEEKLY", label: "Недельное" },
  { value: "MONTHLY", label: "Месячное" },
  { value: "SEASONAL", label: "Сезонное" },
  { value: "CUSTOM", label: "Своё" },
];

const ITEM_TYPES = [
  { value: "COSMETIC", label: "COSMETIC" },
  { value: "TROPHY", label: "TROPHY" },
  { value: "COLLECTIBLE", label: "COLLECTIBLE" },
  { value: "ACCESS_TOKEN", label: "ACCESS_TOKEN" },
  { value: "CONSUMABLE", label: "CONSUMABLE" },
  { value: "QUEST_ITEM", label: "QUEST_ITEM" },
];

const ITEM_CATEGORIES = [
  { value: "avatar", label: "Аватар" },
  { value: "frame", label: "Рамка" },
  { value: "banner", label: "Баннер" },
  { value: "theme", label: "Тема" },
  { value: "collectible", label: "Коллекционный" },
  { value: "trophy", label: "Трофей" },
  { value: "other", label: "Другое" },
];

const EMPTY_CATALOG: ContentCatalog = {
  quests: [],
  achievements: [],
  talents: [],
  items: [],
  rewards: [],
  schools: [],
};

function apiEntityForTab(tab: TabId): ContentEntity {
  if (tab === "titles") return "items";
  return tab;
}

export default function AdminContentPage() {
  const [session, setSession] = useState<SessionUser | null>(null);
  const [catalog, setCatalog] = useState<ContentCatalog>(EMPTY_CATALOG);
  const [tab, setTab] = useState<TabId>("quests");
  const [query, setQuery] = useState("");
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const [questForm, setQuestForm] = useState({ key: "", title: "", type: "CUSTOM", xp: 100, coins: 0 });
  const [achForm, setAchForm] = useState({ key: "", title: "", tiers: "1", xp: 250, coins: 0 });
  const [talentForm, setTalentForm] = useState({ key: "", title: "", rank: 1 });
  const [itemForm, setItemForm] = useState({
    key: "",
    title: "",
    type: "COSMETIC",
    category: "avatar",
  });
  const [rewardForm, setRewardForm] = useState({ key: "", title: "", components: "" });
  const [schoolForm, setSchoolForm] = useState({ key: "", title: "", description: "" });

  const reload = useCallback(async (user: SessionUser) => {
    setError("");
    try {
      setCatalog(await fetchContentCatalog(user));
    } catch {
      setError("Не удалось загрузить каталог контента.");
    }
  }, []);

  useEffect(() => {
    const s = loadSession();
    if (!s) return;
    setSession(s);
    void reload(s);
    const params = new URLSearchParams(window.location.search);
    const fromUrl = params.get("tab") as TabId | null;
    if (fromUrl && TABS.some((item) => item.id === fromUrl)) setTab(fromUrl);
  }, [reload]);

  const titles = useMemo(
    () => catalog.items.filter((item) => item.category === "title"),
    [catalog.items],
  );
  const goods = useMemo(
    () => catalog.items.filter((item) => item.category !== "title"),
    [catalog.items],
  );

  const list = useMemo(() => {
    const source: Array<{ key: string; title: string; meta?: string; badge?: string; value?: string }> =
      tab === "quests"
        ? catalog.quests.map((q) => ({
            key: q.key,
            title: q.title,
            meta: q.key,
            badge: q.type,
            value:
              (q.coins ?? 0) > 0 && q.xp <= 0
                ? `+${q.coins} монет`
                : (q.coins ?? 0) > 0
                  ? `+${q.xp} XP · +${q.coins} монет`
                  : `+${q.xp} XP`,
          }))
        : tab === "achievements"
          ? catalog.achievements.map((a) => ({
              key: a.key,
              title: a.title,
              meta: a.key,
              badge: formatTiers(a.tiers),
              value:
                (a.coins ?? 0) > 0 && a.xp <= 0
                  ? `+${a.coins} монет`
                  : a.xp > 0 && (a.coins ?? 0) > 0
                    ? `+${a.xp} XP · +${a.coins} монет`
                    : a.xp > 0
                      ? `+${a.xp} XP`
                      : "—",
            }))
          : tab === "talents"
            ? catalog.talents.map((t) => ({
                key: t.key,
                title: t.title,
                meta: t.key,
                badge: `Rank ${t.rank}`,
              }))
            : tab === "items"
              ? goods.map((i) => ({
                  key: i.key,
                  title: i.title,
                  meta: i.key,
                  badge: i.category,
                  value: i.type,
                }))
              : tab === "titles"
                ? titles.map((i) => ({
                    key: i.key,
                    title: i.title,
                    meta: i.key,
                    badge: "title",
                    value: i.type,
                  }))
                : tab === "rewards"
                  ? catalog.rewards.map((r) => ({
                      key: r.key,
                      title: r.title,
                      meta: r.key,
                      value: r.components,
                    }))
                  : catalog.schools.map((s) => ({
                      key: s.key,
                      title: s.title,
                      meta: s.key,
                      value: s.description,
                    }));

    const q = query.trim().toLowerCase();
    if (!q) return source;
    return source.filter(
      (item) =>
        item.key.toLowerCase().includes(q) ||
        item.title.toLowerCase().includes(q) ||
        (item.meta ?? "").toLowerCase().includes(q) ||
        (item.badge ?? "").toLowerCase().includes(q),
    );
  }, [tab, catalog, goods, titles, query]);

  function resetForms() {
    setEditingKey(null);
    setQuestForm({ key: "", title: "", type: "CUSTOM", xp: 100, coins: 0 });
    setAchForm({ key: "", title: "", tiers: "1", xp: 250, coins: 0 });
    setTalentForm({ key: "", title: "", rank: 1 });
    setItemForm({
      key: "",
      title: "",
      type: "COSMETIC",
      category: tab === "titles" ? "title" : "avatar",
    });
    setRewardForm({ key: "", title: "", components: "" });
    setSchoolForm({ key: "", title: "", description: "" });
  }

  function onTabChange(id: string) {
    setTab(id as TabId);
    setQuery("");
    setMessage("");
    setError("");
    setEditingKey(null);
    setItemForm({
      key: "",
      title: "",
      type: "COSMETIC",
      category: id === "titles" ? "title" : "avatar",
    });
  }

  function startEdit(key: string) {
    setEditingKey(key);
    setMessage("");
    setError("");
    if (tab === "quests") {
      const quest = catalog.quests.find((q) => q.key === key);
      if (quest) {
        setQuestForm({
          key: quest.key,
          title: quest.title,
          type: quest.type,
          xp: quest.xp,
          coins: quest.coins ?? 0,
        });
      }
    } else if (tab === "achievements") {
      const ach = catalog.achievements.find((a) => a.key === key);
      if (ach) {
        setAchForm({
          key: ach.key,
          title: ach.title,
          tiers: Array.isArray(ach.tiers) ? ach.tiers.join(",") : String(ach.tiers ?? 1),
          xp: ach.xp,
          coins: ach.coins ?? 0,
        });
      }
    } else if (tab === "talents") {
      const talent = catalog.talents.find((t) => t.key === key);
      if (talent) setTalentForm({ key: talent.key, title: talent.title, rank: talent.rank });
    } else if (tab === "items" || tab === "titles") {
      const item = catalog.items.find((i) => i.key === key);
      if (item) {
        setItemForm({
          key: item.key,
          title: item.title,
          type: item.type,
          category: tab === "titles" ? "title" : item.category,
        });
      }
    } else if (tab === "rewards") {
      const reward = catalog.rewards.find((r) => r.key === key);
      if (reward) {
        setRewardForm({ key: reward.key, title: reward.title, components: reward.components });
      }
    } else if (tab === "schools") {
      const school = catalog.schools.find((s) => s.key === key);
      if (school) {
        setSchoolForm({
          key: school.key,
          title: school.title,
          description: school.description,
        });
      }
    }
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!session) return;
    setMessage("");
    setError("");
    try {
      const entity = apiEntityForTab(tab);
      let payload: Record<string, unknown> = {};
      if (tab === "quests") {
        payload = {
          key: questForm.key.trim(),
          title: questForm.title.trim(),
          type: questForm.type,
          xp: Number(questForm.xp) || 0,
          coins: Number(questForm.coins) || 0,
        };
      } else if (tab === "achievements") {
        const tiersRaw = achForm.tiers.trim();
        const tiers = tiersRaw.includes(",")
          ? tiersRaw.split(",").map((x) => Number(x.trim())).filter((n) => !Number.isNaN(n))
          : Number(tiersRaw) || 1;
        payload = {
          key: achForm.key.trim(),
          title: achForm.title.trim(),
          tiers,
          xp: Number(achForm.xp) || 0,
          coins: Number(achForm.coins) || 0,
        };
      } else if (tab === "talents") {
        payload = {
          key: talentForm.key.trim(),
          title: talentForm.title.trim(),
          rank: Number(talentForm.rank) || 1,
        };
      } else if (tab === "items" || tab === "titles") {
        payload = {
          key: itemForm.key.trim(),
          title: itemForm.title.trim(),
          type: itemForm.type,
          category: tab === "titles" ? "title" : itemForm.category,
        };
      } else if (tab === "rewards") {
        payload = {
          key: rewardForm.key.trim(),
          title: rewardForm.title.trim(),
          components: rewardForm.components.trim(),
        };
      } else {
        payload = {
          key: schoolForm.key.trim(),
          title: schoolForm.title.trim(),
          description: schoolForm.description.trim(),
        };
      }
      await upsertContentEntity(session, entity, payload, editingKey);
      setMessage(editingKey ? "Изменения сохранены." : "Запись создана.");
      resetForms();
      if (tab === "titles") {
        setItemForm({ key: "", title: "", type: "COSMETIC", category: "title" });
      }
      await reload(session);
    } catch {
      setError(editingKey ? "Не удалось сохранить." : "Не удалось создать.");
    }
  }

  async function remove(key: string) {
    if (!session || !window.confirm(`Удалить ${key}?`)) return;
    try {
      await deleteContentEntity(session, apiEntityForTab(tab), key);
      if (editingKey === key) resetForms();
      setMessage("Удалено.");
      await reload(session);
    } catch {
      setError("Не удалось удалить.");
    }
  }

  const counts: Record<TabId, number> = {
    quests: catalog.quests.length,
    achievements: catalog.achievements.length,
    talents: catalog.talents.length,
    items: goods.length,
    titles: titles.length,
    rewards: catalog.rewards.length,
    schools: catalog.schools.length,
  };

  return (
    <main className="mx-auto mb-16 mt-4 flex w-full max-w-[1100px] flex-col gap-4 px-3 md:mt-8 md:gap-6 md:px-4">
      <header className="bg-secondaryBg rounded-2xl p-4 backdrop-blur-[20px] md:rounded-[32px] md:p-8">
        <h1 className="font-display text-xl text-mos-text md:text-3xl">Контент</h1>
        <p className="mt-2 font-golos text-sm text-mos-muted">
          Authoring всех сущностей starter bundle: задания, ачивки, таланты, предметы, титулы, награды и
          школы. Seed — `starter.json`. Изменения in-memory до рестарта API.
        </p>
        {error ? <p className="mt-3 text-sm text-[#c45c2a]">{error}</p> : null}
        {message ? <p className="mt-3 text-sm text-mos-amber">{message}</p> : null}
      </header>

      <div className="flex flex-col items-start gap-3 md:flex-row md:gap-6">
        <SideBar
          items={TABS.map((item) => ({
            id: item.id,
            label: `${item.label} (${counts[item.id]})`,
          }))}
          activeId={tab}
          onChange={onTabChange}
          syncUrlParam="tab"
        />

        <div className="flex min-w-0 w-full flex-col gap-4">
          <section className="bg-secondaryBg rounded-2xl p-4 backdrop-blur-[20px] md:rounded-[32px] md:p-6">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="font-display text-sm text-mos-text md:text-[17px]">
                {editingKey ? "Редактирование" : "Новая запись"} — {TABS.find((t) => t.id === tab)?.label}
              </h2>
              {editingKey ? (
                <button type="button" className="og-btn og-btn-secondary og-btn-sm uppercase" onClick={resetForms}>
                  Отмена
                </button>
              ) : null}
            </div>

            <form onSubmit={(e) => void save(e)} className="mt-4 grid gap-3 md:grid-cols-2">
              {tab === "quests" ? (
                <>
                  <KeyTitleFields
                    formKey={questForm.key}
                    title={questForm.title}
                    disabledKey={Boolean(editingKey)}
                    onKey={(value) => setQuestForm((f) => ({ ...f, key: value }))}
                    onTitle={(value) => setQuestForm((f) => ({ ...f, title: value }))}
                    keyPlaceholder="path.custom.demo"
                  />
                  <FormField label="Тип">
                    <SelectField
                      options={QUEST_TYPES}
                      value={questForm.type}
                      onChange={(value) => setQuestForm((f) => ({ ...f, type: value }))}
                    />
                  </FormField>
                  <FormField label="XP" htmlFor="quest_xp">
                    <Input
                      id="quest_xp"
                      type="number"
                      value={String(questForm.xp)}
                      onValueChange={(value) => setQuestForm((f) => ({ ...f, xp: Number(value) || 0 }))}
                    />
                  </FormField>
                  <FormField label="Золото" htmlFor="quest_coins">
                    <Input
                      id="quest_coins"
                      type="number"
                      value={String(questForm.coins)}
                      onValueChange={(value) => setQuestForm((f) => ({ ...f, coins: Number(value) || 0 }))}
                    />
                  </FormField>
                </>
              ) : null}

              {tab === "achievements" ? (
                <>
                  <KeyTitleFields
                    formKey={achForm.key}
                    title={achForm.title}
                    disabledKey={Boolean(editingKey)}
                    onKey={(value) => setAchForm((f) => ({ ...f, key: value }))}
                    onTitle={(value) => setAchForm((f) => ({ ...f, title: value }))}
                    keyPlaceholder="start.custom.demo"
                  />
                  <FormField label="Тиры" htmlFor="ach_tiers">
                    <Input
                      id="ach_tiers"
                      value={achForm.tiers}
                      onValueChange={(value) => setAchForm((f) => ({ ...f, tiers: value }))}
                      placeholder="1 или 1,5,10"
                    />
                  </FormField>
                  <FormField label="XP" htmlFor="ach_xp">
                    <Input
                      id="ach_xp"
                      type="number"
                      value={String(achForm.xp)}
                      onValueChange={(value) => setAchForm((f) => ({ ...f, xp: Number(value) || 0 }))}
                    />
                  </FormField>
                  <FormField label="Золото" htmlFor="ach_coins">
                    <Input
                      id="ach_coins"
                      type="number"
                      value={String(achForm.coins)}
                      onValueChange={(value) => setAchForm((f) => ({ ...f, coins: Number(value) || 0 }))}
                    />
                  </FormField>
                </>
              ) : null}

              {tab === "talents" ? (
                <>
                  <KeyTitleFields
                    formKey={talentForm.key}
                    title={talentForm.title}
                    disabledKey={Boolean(editingKey)}
                    onKey={(value) => setTalentForm((f) => ({ ...f, key: value }))}
                    onTitle={(value) => setTalentForm((f) => ({ ...f, title: value }))}
                    keyPlaceholder="arsenal.custom"
                  />
                  <FormField label="Rank" htmlFor="talent_rank">
                    <Input
                      id="talent_rank"
                      type="number"
                      value={String(talentForm.rank)}
                      onValueChange={(value) => setTalentForm((f) => ({ ...f, rank: Number(value) || 1 }))}
                    />
                  </FormField>
                </>
              ) : null}

              {tab === "items" || tab === "titles" ? (
                <>
                  <KeyTitleFields
                    formKey={itemForm.key}
                    title={itemForm.title}
                    disabledKey={Boolean(editingKey)}
                    onKey={(value) => setItemForm((f) => ({ ...f, key: value }))}
                    onTitle={(value) => setItemForm((f) => ({ ...f, title: value }))}
                    keyPlaceholder={
                      tab === "titles"
                        ? "school.fencing.title.custom"
                        : "school.fencing.frame.custom"
                    }
                  />
                  <FormField label="Тип предмета">
                    <SelectField
                      options={ITEM_TYPES}
                      value={itemForm.type}
                      onChange={(value) => setItemForm((f) => ({ ...f, type: value }))}
                    />
                  </FormField>
                  {tab === "items" ? (
                    <FormField label="Категория">
                      <SelectField
                        options={ITEM_CATEGORIES}
                        value={itemForm.category}
                        onChange={(value) => setItemForm((f) => ({ ...f, category: value }))}
                      />
                    </FormField>
                  ) : (
                    <p className="font-golos text-xs text-mos-muted md:col-span-2">
                      Титулы сохраняются как COSMETIC Item с категорией `title`.
                    </p>
                  )}
                </>
              ) : null}

              {tab === "rewards" ? (
                <>
                  <KeyTitleFields
                    formKey={rewardForm.key}
                    title={rewardForm.title}
                    disabledKey={Boolean(editingKey)}
                    onKey={(value) => setRewardForm((f) => ({ ...f, key: value }))}
                    onTitle={(value) => setRewardForm((f) => ({ ...f, title: value }))}
                    keyPlaceholder="school.fencing.reward.custom"
                  />
                  <FormField label="Состав награды" htmlFor="reward_components" className="md:col-span-2">
                    <Textarea
                      id="reward_components"
                      value={rewardForm.components}
                      onValueChange={(value) => setRewardForm((f) => ({ ...f, components: value }))}
                      placeholder="500 опыта, значок…"
                      required
                    />
                  </FormField>
                </>
              ) : null}

              {tab === "schools" ? (
                <>
                  <KeyTitleFields
                    formKey={schoolForm.key}
                    title={schoolForm.title}
                    disabledKey={Boolean(editingKey)}
                    onKey={(value) => setSchoolForm((f) => ({ ...f, key: value }))}
                    onTitle={(value) => setSchoolForm((f) => ({ ...f, title: value }))}
                    keyPlaceholder="witcher"
                  />
                  <FormField label="Описание" htmlFor="school_desc" className="md:col-span-2">
                    <Textarea
                      id="school_desc"
                      value={schoolForm.description}
                      onValueChange={(value) => setSchoolForm((f) => ({ ...f, description: value }))}
                      placeholder="Краткое описание курса…"
                    />
                  </FormField>
                </>
              ) : null}

              <div className="md:col-span-2">
                <button type="submit" className="og-btn og-btn-primary og-btn-md w-full uppercase md:w-auto">
                  {editingKey ? "Сохранить изменения" : "Создать"}
                </button>
              </div>
            </form>
          </section>

          <section className="bg-secondaryBg rounded-2xl p-4 backdrop-blur-[20px] md:rounded-[32px] md:p-6">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <h2 className="font-display text-sm text-mos-text md:text-[17px]">
                  Каталог <span className="text-mos-amber">({list.length})</span>
                </h2>
                <p className="mt-1 font-golos text-xs text-mos-muted">Изменить или удалить существующую запись</p>
              </div>
              <div className="w-full max-w-xs">
                <Input value={query} onValueChange={setQuery} placeholder="Поиск…" />
              </div>
            </div>
            <ul className="mt-4 max-h-[520px] space-y-2 overflow-auto">
              {list.map((item) => {
                const active = editingKey === item.key;
                return (
                  <li
                    key={item.key}
                    className={cn(
                      "rounded-2xl border px-3 py-3 md:rounded-[20px] md:px-4",
                      active ? "border-mos-amber/60 bg-mos-amber/10" : "border-white/10 bg-mos-bg/35",
                    )}
                  >
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div className="min-w-0 space-y-1">
                        <p className="font-display text-xs text-mos-text md:text-sm">{item.title}</p>
                        <p className="truncate font-golos text-[10px] text-mos-muted md:text-xs">{item.meta}</p>
                        {item.value && (tab === "rewards" || tab === "schools") ? (
                          <p className="font-golos text-xs text-mos-muted">{item.value}</p>
                        ) : null}
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        {item.badge ? (
                          <span className="rounded-lg bg-white/5 px-2 py-0.5 font-golos text-[10px] uppercase text-mos-muted">
                            {item.badge}
                          </span>
                        ) : null}
                        {item.value && tab !== "rewards" && tab !== "schools" ? (
                          <span className="font-display text-[10px] text-mos-amber md:text-xs">{item.value}</span>
                        ) : null}
                        <button
                          type="button"
                          className="og-btn og-btn-secondary og-btn-sm uppercase"
                          onClick={() => startEdit(item.key)}
                        >
                          Изменить
                        </button>
                        <button
                          type="button"
                          className="og-btn og-btn-secondary og-btn-sm uppercase text-[#c45c2a]"
                          onClick={() => void remove(item.key)}
                        >
                          Удалить
                        </button>
                      </div>
                    </div>
                  </li>
                );
              })}
              {list.length === 0 ? (
                <li className="py-8 text-center font-golos text-sm text-mos-muted">Записей нет</li>
              ) : null}
            </ul>
          </section>
        </div>
      </div>
    </main>
  );
}

function KeyTitleFields({
  formKey,
  title,
  disabledKey,
  onKey,
  onTitle,
  keyPlaceholder,
}: {
  formKey: string;
  title: string;
  disabledKey: boolean;
  onKey: (value: string) => void;
  onTitle: (value: string) => void;
  keyPlaceholder: string;
}) {
  return (
    <>
      <FormField label="Ключ" htmlFor="entity_key">
        <Input
          id="entity_key"
          value={formKey}
          onValueChange={onKey}
          placeholder={keyPlaceholder}
          disabled={disabledKey}
          required
        />
      </FormField>
      <FormField label="Название" htmlFor="entity_title">
        <Input id="entity_title" value={title} onValueChange={onTitle} required />
      </FormField>
    </>
  );
}

function formatTiers(tiers: number | number[]): string {
  if (Array.isArray(tiers)) return `${tiers.length} tiers`;
  return `${tiers} tier`;
}
