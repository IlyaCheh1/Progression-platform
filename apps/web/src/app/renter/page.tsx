"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  createRentalBooking,
  fetchHallAvailability,
  fetchRenterBookings,
  type RentalBooking,
} from "@/lib/school-api";
import { hasRole, loadSession, type SessionUser } from "@/lib/session";
import { routes } from "@/lib/routes";

export default function RenterCabinetPage() {
  const router = useRouter();
  const [user, setUser] = useState<SessionUser | null>(null);
  const [bookings, setBookings] = useState<RentalBooking[]>([]);
  const [busySlots, setBusySlots] = useState(0);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const reload = useCallback(async (session: SessionUser) => {
    const [b, slots] = await Promise.all([
      fetchRenterBookings(session),
      fetchHallAvailability("hall-main"),
    ]);
    setBookings(b);
    setBusySlots(slots.length);
  }, []);

  useEffect(() => {
    const s = loadSession();
    if (!s) {
      router.replace("/login");
      return;
    }
    if (!hasRole(s.roles, "renter")) {
      router.replace("/profile");
      return;
    }
    setUser(s);
    void reload(s).catch(() => setError("Не удалось загрузить данные арендатора."));
  }, [router, reload]);

  async function bookNightSlot() {
    if (!user) return;
    setMessage("");
    setError("");
    const start = new Date();
    start.setDate(start.getDate() + 2);
    start.setHours(22, 0, 0, 0);
    const end = new Date(start);
    end.setHours(1, 0, 0, 0);
    end.setDate(end.getDate() + 1);
    try {
      const b = await createRentalBooking(user, "hall-main", start.toISOString(), end.toISOString());
      setMessage(`Заявка создана: ${b.id} (${b.status})`);
      await reload(user);
    } catch {
      setError("Слот недоступен или конфликт с расписанием.");
    }
  }

  return (
    <main className="mx-auto max-w-3xl px-4 py-16 text-mos-text">
      <p className="font-display tracking-[0.18em] text-mos-amber">RENTER</p>
      <h1 className="mt-2 font-display text-3xl">Кабинет арендатора</h1>
      <p className="mt-4 text-sm text-mos-muted">
        Бронирование зала, занятость календаря и статус заявок.
      </p>
      <p className="mt-2 text-xs opacity-60">Занятых интервалов в hall-main: {busySlots}</p>
      {message && <p className="mt-4 text-green-400">{message}</p>}
      {error && <p className="mt-4 text-red-400">{error}</p>}
      <button
        type="button"
        onClick={() => void bookNightSlot()}
        className="mos-btn mt-6"
      >
        Забронировать ночной слот (22:00–01:00)
      </button>
      <h2 className="mt-10 font-display text-lg">Мои аренды</h2>
      <ul className="mt-4 space-y-2 text-sm">
        {bookings.map((b) => (
          <li key={b.id} className="rounded border border-mos-line/30 p-3">
            {b.id} · {b.status} · {new Date(b.createdAt).toLocaleString("ru-RU")}
          </li>
        ))}
        {bookings.length === 0 && <li className="text-mos-muted">Аренд пока нет</li>}
      </ul>
      <div className="mt-8 flex gap-4">
        <Link href={routes.schedule} className="text-sm underline">
          Публичное расписание
        </Link>
        <Link href={routes.home} className="text-sm underline">
          К профилю
        </Link>
      </div>
    </main>
  );
}
