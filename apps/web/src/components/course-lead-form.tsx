"use client";

import { useState } from "react";
import Button from "@/components/ui/button";
import { COURSE_LEAD_SOURCE, type LandingLeadFieldErrors } from "@/lib/landing/lead";

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

type CourseLeadFormProps = {
  direction: string;
  accentColor: string;
};

export default function CourseLeadForm({ direction, accentColor }: CourseLeadFormProps) {
  const [form, setForm] = useState<FormState>(EMPTY);
  const [errors, setErrors] = useState<LandingLeadFieldErrors>({});
  const [busy, setBusy] = useState(false);
  const [doneId, setDoneId] = useState("");
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
          direction,
          source: COURSE_LEAD_SOURCE,
        }),
      });
      const data = (await res.json()) as { error?: string; errors?: LandingLeadFieldErrors; id?: string };
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
      <div className="rounded-2xl border border-mos-line/40 bg-mos-stone/30 p-6 text-center" role="status">
        <p className="font-unbounded text-xl text-mos-text">Заявка отправлена</p>
        <p className="mt-2 text-sm text-mos-muted">Мы получили обращение. Администратор школы свяжется по телефону.</p>
        <button
          type="button"
          className="mt-5 min-h-11 text-sm uppercase tracking-widest"
          style={{ color: accentColor }}
          onClick={() => setDoneId("")}
        >
          Отправить ещё
        </button>
      </div>
    );
  }

  return (
    <form className="text-left" onSubmit={onSubmit} noValidate>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="mb-2 block text-xs uppercase tracking-[0.12em] text-mos-muted">Имя</span>
          <input
            type="text"
            autoComplete="name"
            required
            value={form.name}
            onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
            className="course-lead-input"
          />
          {errors.name ? <span className="mt-2 block text-sm text-red-400">{errors.name}</span> : null}
        </label>
        <label className="block">
          <span className="mb-2 block text-xs uppercase tracking-[0.12em] text-mos-muted">Телефон</span>
          <input
            type="tel"
            autoComplete="tel"
            required
            value={form.phone}
            onChange={(event) => setForm((current) => ({ ...current, phone: event.target.value }))}
            className="course-lead-input"
            placeholder="+7"
          />
          {errors.phone ? <span className="mt-2 block text-sm text-red-400">{errors.phone}</span> : null}
        </label>
        <label className="block sm:col-span-2">
          <span className="mb-2 block text-xs uppercase tracking-[0.12em] text-mos-muted">Email (необязательно)</span>
          <input
            type="email"
            autoComplete="email"
            value={form.email}
            onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
            className="course-lead-input"
          />
          {errors.email ? <span className="mt-2 block text-sm text-red-400">{errors.email}</span> : null}
        </label>
        <label className="block sm:col-span-2">
          <span className="mb-2 block text-xs uppercase tracking-[0.12em] text-mos-muted">Комментарий</span>
          <textarea
            rows={3}
            value={form.comment}
            onChange={(event) => setForm((current) => ({ ...current, comment: event.target.value }))}
            className="course-lead-input min-h-[5.5rem] py-3"
          />
        </label>
      </div>

      {fail ? <p className="mt-4 text-sm text-red-400">{fail}</p> : null}

      <div className="mt-6">
        <Button type="submit" variant="primary" size="md" className="uppercase" disabled={busy}>
          {busy ? "Отправка…" : "Отправить заявку"}
        </Button>
      </div>
    </form>
  );
}
