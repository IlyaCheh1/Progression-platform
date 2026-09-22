"use client";

import OpsCalendar from "@/components/admin/ops-calendar";

export default function AdminCalendarPage() {
  return (
    <main className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="font-display text-3xl text-mos-text">Календарь тренировок</h1>
      <p className="mt-2 text-sm text-mos-muted">
        Занятия, назначение учеников, бронь залов и занятость по залам.
      </p>
      <div className="mt-8">
        <OpsCalendar allowCreate allowRental />
      </div>
    </main>
  );
}
