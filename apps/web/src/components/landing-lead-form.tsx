"use client";

import { useState } from "react";
import Button from "@/components/ui/button";
import type { LandingLeadFieldErrors } from "@/lib/landing/lead";

type FormState = {
  name: string;
  phone: string;
  email: string;
  comment: string;
};

const EMPTY: FormState = {
  name: "",
  phone: "",
  email: "",
  comment: "",
};

export default function LandingLeadForm() {
  const [form, setForm] = useState<FormState>(EMPTY);
  const [errors, setErrors] = useState<LandingLeadFieldErrors>({});
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [fail, setFail] = useState("");

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setFail("");
    setErrors({});
    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          phone: form.phone,
          email: form.email,
          comment: form.comment,
        }),
      });
      const data = (await res.json()) as { error?: string; errors?: LandingLeadFieldErrors };
      if (res.status === 429) {
        setFail("Слишком много заявок. Подождите пару минут.");
        return;
      }
      if (!res.ok) {
        setErrors(data.errors ?? {});
        setFail(data.error === "validation_failed" ? "Проверьте поля формы." : "Не удалось отправить заявку.");
        return;
      }
      setDone(true);
      setForm(EMPTY);
    } catch {
      setFail("Сеть недоступна. Попробуйте ещё раз.");
    } finally {
      setBusy(false);
    }
  }

  if (done) {
    return (
      <div className="landing-lead-form-done promo-card w-full text-center" role="status">
        <p className="font-unbounded text-xl text-white">Заявка отправлена</p>
        <p className="mt-2 text-sm text-white/55">Мы получили обращение. Администратор школы свяжется по телефону.</p>
        <button type="button" className="mt-5 min-h-11 text-sm uppercase tracking-widest text-mos-amber" onClick={() => setDone(false)}>
          Отправить ещё
        </button>
      </div>
    );
  }

  return (
    <form className="landing-lead-form text-left" onSubmit={onSubmit} noValidate>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block">
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

      <div className="mt-6 flex justify-center">
        <Button type="submit" variant="primary" size="lg" className="cta-pulse w-full uppercase sm:w-auto" disabled={busy}>
          {busy ? "Отправка…" : "Отправить заявку"}
        </Button>
      </div>
    </form>
  );
}
