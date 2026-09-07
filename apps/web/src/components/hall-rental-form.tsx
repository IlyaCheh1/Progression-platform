"use client";

import { useState } from "react";
import Button from "@/components/ui/button";
import {
  HALL_RENTAL_CADENCE,
  HALL_RENTAL_DAYS,
  HALL_RENTAL_HOURS_MAX,
  HALL_RENTAL_HOURS_MIN,
  type HallRentalFieldErrors,
} from "@/lib/landing/hall-rental";

const HOURS = Array.from(
  { length: HALL_RENTAL_HOURS_MAX - HALL_RENTAL_HOURS_MIN + 1 },
  (_, index) => HALL_RENTAL_HOURS_MIN + index,
);

type FormState = {
  days: string[];
  startTime: string;
  hours: string;
  cadence: string;
  name: string;
  phone: string;
  email: string;
  comment: string;
};

const EMPTY: FormState = {
  days: [],
  startTime: "18:00",
  hours: "2",
  cadence: "one_time",
  name: "",
  phone: "",
  email: "",
  comment: "",
};

export default function HallRentalForm() {
  const [form, setForm] = useState<FormState>(EMPTY);
  const [errors, setErrors] = useState<HallRentalFieldErrors>({});
  const [busy, setBusy] = useState(false);
  const [doneId, setDoneId] = useState("");
  const [fail, setFail] = useState("");

  function toggleDay(id: string) {
    setForm((current) => ({
      ...current,
      days: current.days.includes(id) ? current.days.filter((day) => day !== id) : [...current.days, id],
    }));
  }

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setFail("");
    setErrors({});
    try {
      const res = await fetch("/api/hall-rental", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          days: form.days,
          startTime: form.startTime,
          hours: Number(form.hours),
          cadence: form.cadence,
          name: form.name,
          phone: form.phone,
          email: form.email,
          comment: form.comment,
        }),
      });
      const data = (await res.json()) as { error?: string; errors?: HallRentalFieldErrors; id?: string };
      if (res.status === 429) {
        setFail("Слишком много заявок. Подождите пару минут.");
        return;
      }
      if (!res.ok) {
        setErrors(data.errors ?? {});
        setFail(data.error === "validation_failed" ? "Проверьте поля формы." : "Не удалось отправить заявку.");
        return;
      }
      setDoneId(data.id ?? "ok");
      setForm(EMPTY);
    } catch {
      setFail("Сеть недоступна. Попробуйте ещё раз.");
    } finally {
      setBusy(false);
    }
  }

  if (doneId) {
    return (
      <div className="hall-rental-form-done promo-card w-full" role="status">
        <p className="font-unbounded text-xl text-white">Заявка ушла администратору</p>
        <p className="mt-2 text-sm text-white/55">
          Мы получили запрос {doneId}. Администратор школы свяжется по телефону. Полный inbox в ЛК — фаза 2.
        </p>
        <button type="button" className="mt-5 min-h-11 text-sm uppercase tracking-widest text-mos-amber" onClick={() => setDoneId("")}>
          Отправить ещё
        </button>
      </div>
    );
  }

  return (
    <form id="zayavka" className="hall-rental-form" onSubmit={onSubmit} noValidate>
      <fieldset>
        <legend className="mb-3 text-xs font-semibold uppercase tracking-[0.14em] text-mos-amber">Дни</legend>
        <div className="flex flex-wrap gap-2">
          {HALL_RENTAL_DAYS.map((day) => {
            const active = form.days.includes(day.id);
            return (
              <button
                key={day.id}
                type="button"
                aria-pressed={active}
                className={`hall-day-chip ${active ? "is-active" : ""}`}
                onClick={() => toggleDay(day.id)}
              >
                {day.label}
              </button>
            );
          })}
        </div>
        {errors.days ? <p className="mt-2 text-sm text-red-300">{errors.days}</p> : null}
      </fieldset>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="mb-2 block text-xs uppercase tracking-[0.12em] text-white/50">Время начала</span>
          <input
            type="time"
            required
            value={form.startTime}
            onChange={(event) => setForm((current) => ({ ...current, startTime: event.target.value }))}
            className="hall-rental-input"
          />
          {errors.startTime ? <span className="mt-2 block text-sm text-red-300">{errors.startTime}</span> : null}
        </label>
        <label className="block">
          <span className="mb-2 block text-xs uppercase tracking-[0.12em] text-white/50">Часы</span>
          <select
            value={form.hours}
            onChange={(event) => setForm((current) => ({ ...current, hours: event.target.value }))}
            className="hall-rental-input"
          >
            {HOURS.map((value) => (
              <option key={value} value={value}>
                {value} ч
              </option>
            ))}
          </select>
          {errors.hours ? <span className="mt-2 block text-sm text-red-300">{errors.hours}</span> : null}
        </label>
      </div>

      <fieldset className="mt-6">
        <legend className="mb-3 text-xs font-semibold uppercase tracking-[0.14em] text-mos-amber">Формат</legend>
        <div className="flex flex-wrap gap-2">
          {HALL_RENTAL_CADENCE.map((item) => (
            <label key={item.id} className={`hall-day-chip ${form.cadence === item.id ? "is-active" : ""}`}>
              <input
                type="radio"
                name="cadence"
                value={item.id}
                checked={form.cadence === item.id}
                onChange={() => setForm((current) => ({ ...current, cadence: item.id }))}
                className="sr-only"
              />
              {item.label}
            </label>
          ))}
        </div>
        {errors.cadence ? <p className="mt-2 text-sm text-red-300">{errors.cadence}</p> : null}
      </fieldset>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <label className="block sm:col-span-1">
          <span className="mb-2 block text-xs uppercase tracking-[0.12em] text-white/50">Имя</span>
          <input
            type="text"
            autoComplete="name"
            required
            value={form.name}
            onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
            className="hall-rental-input"
          />
          {errors.name ? <span className="mt-2 block text-sm text-red-300">{errors.name}</span> : null}
        </label>
        <label className="block">
          <span className="mb-2 block text-xs uppercase tracking-[0.12em] text-white/50">Телефон</span>
          <input
            type="tel"
            autoComplete="tel"
            required
            value={form.phone}
            onChange={(event) => setForm((current) => ({ ...current, phone: event.target.value }))}
            className="hall-rental-input"
            placeholder="+7"
          />
          {errors.phone ? <span className="mt-2 block text-sm text-red-300">{errors.phone}</span> : null}
        </label>
        <label className="block sm:col-span-2">
          <span className="mb-2 block text-xs uppercase tracking-[0.12em] text-white/50">Email (необязательно)</span>
          <input
            type="email"
            autoComplete="email"
            value={form.email}
            onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
            className="hall-rental-input"
          />
          {errors.email ? <span className="mt-2 block text-sm text-red-300">{errors.email}</span> : null}
        </label>
        <label className="block sm:col-span-2">
          <span className="mb-2 block text-xs uppercase tracking-[0.12em] text-white/50">Комментарий</span>
          <textarea
            rows={3}
            value={form.comment}
            onChange={(event) => setForm((current) => ({ ...current, comment: event.target.value }))}
            className="hall-rental-input min-h-[5.5rem] py-3"
          />
        </label>
      </div>

      {fail ? <p className="mt-4 text-sm text-red-300">{fail}</p> : null}

      <div className="mt-6">
        <Button type="submit" variant="primary" size="lg" className="w-full uppercase sm:w-auto" disabled={busy}>
          {busy ? "Отправка…" : "Отправить заявку"}
        </Button>
      </div>
    </form>
  );
}
