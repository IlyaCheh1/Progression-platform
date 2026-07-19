"use client";

import Link from "next/link";

export default function AdminHomePage() {
  return (
    <main className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="font-display text-3xl text-mos-text">Админка платформы</h1>
      <p className="mt-2 max-w-2xl text-sm text-mos-muted">
        Временный локальный контур: админ школы (учётки учеников, подтверждение посещаемости) и authoring
        заданий/достижений. Не для production.
      </p>
      <div className="mt-8 grid gap-4 md:grid-cols-3">
        <Link href="/admin/users" className="border border-mos-line/40 bg-mos-stone/30 p-5 hover:border-mos-amber">
          <h2 className="font-display text-xl text-mos-amber">Пользователи</h2>
          <p className="mt-2 text-sm text-mos-muted">Создание, редактирование и удаление учётных записей и ролей.</p>
        </Link>
        <Link href="/admin/school" className="border border-mos-line/40 bg-mos-stone/30 p-5 hover:border-mos-amber">
          <h2 className="font-display text-xl text-mos-amber">Школа</h2>
          <p className="mt-2 text-sm text-mos-muted">Список учеников и подтверждение attendance → XP.</p>
        </Link>
        <Link href="/admin/content" className="border border-mos-line/40 bg-mos-stone/30 p-5 hover:border-mos-amber">
          <h2 className="font-display text-xl text-mos-amber">Контент</h2>
          <p className="mt-2 text-sm text-mos-muted">Создание и просмотр заданий (quests) и достижений.</p>
        </Link>
      </div>
    </main>
  );
}
