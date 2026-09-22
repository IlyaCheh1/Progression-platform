"use client";

import Link from "next/link";

const CARDS = [
  {
    href: "/admin/calendar",
    title: "Календарь",
    body: "Тренировки, назначение учеников, бронь зала и занятость.",
  },
  {
    href: "/admin/users",
    title: "Пользователи",
    body: "Ученик, тренер, админ, представитель, арендатор — CRUD ролей.",
  },
  {
    href: "/admin/groups",
    title: "Группы",
    body: "Группы занятий с назначением учеников и тренера.",
  },
  {
    href: "/admin/halls",
    title: "Залы",
    body: "Справочник залов и календарь кто когда занимает.",
  },
  {
    href: "/admin/crm",
    title: "CRM",
    body: "Лиды, воронка и задачи.",
  },
  {
    href: "/admin/notifications",
    title: "Уведомления",
    body: "Отправка уведомлений пользователям и журнал.",
  },
  {
    href: "/admin/payments",
    title: "Оплаты",
    body: "ЮKassa: платежи абонементов (sandbox / live).",
  },
  {
    href: "/admin/school",
    title: "Школа",
    body: "Ростер и быстрое подтверждение attendance → XP.",
  },
  {
    href: "/admin/content",
    title: "Контент",
    body: "Задания, достижения, таланты.",
  },
  {
    href: "/admin/arenda",
    title: "Аренда",
    body: "Публичные заявки на аренду зала.",
  },
  {
    href: "/admin/import",
    title: "Import",
    body: "Staging / preview / commit Excel-JSON.",
  },
] as const;

export default function AdminHomePage() {
  return (
    <main className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="font-display text-3xl text-mos-text">Админ-панель школы</h1>
      <p className="mt-2 max-w-2xl text-sm text-mos-muted">
        Операционная CRM: пользователи, расписание, группы, залы, уведомления и оплаты. Вход из меню профиля
        для роли администратора.
      </p>
      <div className="mt-8 grid gap-4 md:grid-cols-3">
        {CARDS.map((card) => (
          <Link
            key={card.href}
            href={card.href}
            className="border border-mos-line/40 bg-mos-stone/30 p-5 hover:border-mos-amber"
          >
            <h2 className="font-display text-xl text-mos-amber">{card.title}</h2>
            <p className="mt-2 text-sm text-mos-muted">{card.body}</p>
          </Link>
        ))}
      </div>
    </main>
  );
}
