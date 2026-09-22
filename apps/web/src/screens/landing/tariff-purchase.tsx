"use client";

import { useEffect, useId, useRef, useState } from "react";
import Link from "next/link";
import Button from "@/components/ui/button";
import { ADULT_COURSE_SLIDES } from "@/lib/landing/adult-directions";
import {
  PURCHASE_ONLINE_ADDON,
  PURCHASE_PAYMENT_NOTICE,
  PURCHASE_TARIFFS,
  lookupPurchaseClient,
  purchasePhone,
  purchaseTariff,
  registrationErrors,
  type PurchaseGender,
  type PurchaseRegistration,
  type PurchaseTariffId,
} from "@/lib/landing/tariff-purchase";

type Step = "phone" | "register" | "section" | "subscribe";

const STEPS = [
  { id: "register", label: "Регистрация" },
  { id: "section", label: "Секция" },
  { id: "subscribe", label: "Подписка" },
] as const;

const SECTIONS = ADULT_COURSE_SLIDES.map((slide) => ({
  key: slide.key,
  title: slide.title,
  summary: slide.description,
  image: slide.image ? `/media/hero/${slide.image}` : null,
}));

export default function TariffPurchase({ tariffId, onClose }: { tariffId: PurchaseTariffId; onClose: () => void }) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const [step, setStep] = useState<Step>("phone");
  const [phoneRaw, setPhoneRaw] = useState("");
  const [phoneError, setPhoneError] = useState("");
  const [form, setForm] = useState<PurchaseRegistration>({
    name: "",
    surname: "",
    email: "",
    birthDate: "",
    phone: "",
    gender: "",
  });
  const [formErrors, setFormErrors] = useState<Partial<Record<keyof PurchaseRegistration, string>>>({});
  const [sectionKeys, setSectionKeys] = useState<string[]>(() => (SECTIONS[0] ? [SECTIONS[0].key] : []));
  const [sectionError, setSectionError] = useState("");
  const [selectedTariff, setSelectedTariff] = useState(tariffId);
  const [onlineAddon, setOnlineAddon] = useState(false);
  const [promoCode, setPromoCode] = useState("");
  const [promoNotice, setPromoNotice] = useState("");
  const [payNotice, setPayNotice] = useState("");
  const [infoConsent, setInfoConsent] = useState(false);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    const scrollX = window.scrollX;
    const scrollY = window.scrollY;
    const root = document.documentElement;
    const previousScrollBehavior = root.style.scrollBehavior;
    root.style.scrollBehavior = "auto";
    const restoreScroll = () => window.scrollTo(scrollX, scrollY);
    const pinScroll = () => {
      if (window.scrollX !== scrollX || window.scrollY !== scrollY) restoreScroll();
    };
    const handleClose = () => {
      if (dialog.dataset.suppressClose === "1") {
        delete dialog.dataset.suppressClose;
        return;
      }
      onClose();
    };
    dialog.addEventListener("close", handleClose);
    window.addEventListener("scroll", pinScroll);
    if (!dialog.open) dialog.showModal();
    restoreScroll();
    dialog.querySelector<HTMLInputElement>("[data-purchase-phone]")?.focus({ preventScroll: true });
    restoreScroll();
    const frame = requestAnimationFrame(restoreScroll);
    const timer = window.setTimeout(() => window.removeEventListener("scroll", pinScroll), 500);
    return () => {
      cancelAnimationFrame(frame);
      window.clearTimeout(timer);
      window.removeEventListener("scroll", pinScroll);
      dialog.dataset.suppressClose = "1";
      dialog.removeEventListener("close", handleClose);
      if (dialog.open) dialog.close();
      restoreScroll();
      root.style.scrollBehavior = previousScrollBehavior;
    };
  }, [onClose]);

  const checkPhone = () => {
    const phone = purchasePhone(phoneRaw);
    if (!phone) {
      setPhoneError("Укажите телефон.");
      return;
    }
    setPhoneError("");
    setForm((current) => ({ ...current, phone }));
    const lookup = lookupPurchaseClient(phone);
    if (lookup.known) {
      setStep("subscribe");
      return;
    }
    setStep("register");
  };

  const continueRegistration = () => {
    const errors = registrationErrors(form);
    setFormErrors(errors);
    if (Object.keys(errors).length > 0) return;
    setStep("section");
  };

  const tariff = purchaseTariff(selectedTariff);

  return (
    <dialog
      ref={dialogRef}
      className={step === "phone" ? "purchase-dialog is-phone" : "purchase-dialog"}
      aria-labelledby={titleId}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <button type="button" className="format-dialog-close" aria-label="Закрыть" onClick={onClose}>
        <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden>
          <path d="M6 6l12 12M18 6 6 18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      </button>

      {step === "phone" ? (
        <div className="purchase-phone">
          <h2 id={titleId} className="font-unbounded text-white">
            Давайте знакомиться
          </h2>
          <label className="purchase-phone-row">
            <span className="purchase-phone-prefix" aria-hidden="true">
              +7
            </span>
            <input
              data-purchase-phone=""
              value={phoneRaw}
              inputMode="tel"
              autoComplete="tel"
              aria-label="Телефон"
              onChange={(event) => setPhoneRaw(event.target.value)}
            />
          </label>
          {phoneError ? <p className="purchase-error">{phoneError}</p> : null}
          <Button type="button" variant="primary" size="md" className="purchase-phone-check uppercase" onClick={checkPhone}>
            Проверить
          </Button>
          <label className="callback-check">
            <input
              type="checkbox"
              name="info-consent"
              checked={infoConsent}
              onChange={(event) => setInfoConsent(event.target.checked)}
            />
            <span>
              Согласен на{" "}
              <Link href="/legal/info-consent" className="callback-doc">
                получение информационных материалов
              </Link>
            </span>
          </label>
        </div>
      ) : (
        <div className="purchase-copy">
          <ol className="purchase-steps" aria-label="Шаги покупки">
            {STEPS.map((item) => (
              <li key={item.id} className={item.id === step ? "is-active" : ""}>
                {item.label}
              </li>
            ))}
          </ol>

          {step === "register" ? (
            <form
              className="purchase-step"
              onSubmit={(event) => {
                event.preventDefault();
                continueRegistration();
              }}
            >
              <h2 id={titleId} className="font-unbounded text-2xl text-white">
                Регистрация
              </h2>
              <div className="purchase-grid">
                <Field label="Имя" value={form.name} error={formErrors.name} onChange={(name) => setForm({ ...form, name })} />
                <Field
                  label="Фамилия"
                  value={form.surname}
                  error={formErrors.surname}
                  onChange={(surname) => setForm({ ...form, surname })}
                />
                <Field
                  label="Почта"
                  type="email"
                  value={form.email}
                  error={formErrors.email}
                  onChange={(email) => setForm({ ...form, email })}
                />
                <Field
                  label="Дата рождения"
                  type="date"
                  value={form.birthDate}
                  error={formErrors.birthDate}
                  onChange={(birthDate) => setForm({ ...form, birthDate })}
                />
                <Field
                  label="Телефон"
                  value={form.phone}
                  error={formErrors.phone}
                  onChange={(phone) => setForm({ ...form, phone })}
                />
                <SiteSelect
                  label="Пол"
                  value={form.gender}
                  placeholder="Выберите"
                  error={formErrors.gender}
                  options={[
                    { value: "female", label: "Женский" },
                    { value: "male", label: "Мужской" },
                  ]}
                  onChange={(gender) => setForm({ ...form, gender: gender as PurchaseGender })}
                />
              </div>
              <Button type="submit" variant="primary" size="md" className="purchase-next uppercase">
                Далее
              </Button>
            </form>
          ) : null}

          {step === "section" ? (
            <div className="purchase-step">
              <h2 id={titleId} className="font-unbounded text-2xl text-white">
                Секция
              </h2>
              <div className="purchase-sections" role="listbox" aria-multiselectable="true" aria-label="Секции">
                {SECTIONS.map((section) => {
                  const selected = sectionKeys.includes(section.key);
                  return (
                    <button
                      key={section.key}
                      type="button"
                      role="option"
                      aria-selected={selected}
                      className={`purchase-section ${selected ? "is-active" : ""}`}
                      onClick={() => {
                        setSectionError("");
                        setSectionKeys((current) =>
                          current.includes(section.key)
                            ? current.filter((key) => key !== section.key)
                            : [...current, section.key],
                        );
                      }}
                    >
                      {section.image ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={section.image} alt="" />
                      ) : null}
                      <span className="font-unbounded text-sm text-white">{section.title}</span>
                      <span className="text-xs leading-relaxed text-white/55">{section.summary}</span>
                    </button>
                  );
                })}
              </div>
              {sectionError ? <p className="purchase-error">{sectionError}</p> : null}
              <Button
                type="button"
                variant="primary"
                size="md"
                className="purchase-next uppercase"
                onClick={() => {
                  if (sectionKeys.length === 0) {
                    setSectionError("Выберите хотя бы одну секцию.");
                    return;
                  }
                  setStep("subscribe");
                }}
              >
                Далее
              </Button>
            </div>
          ) : null}

          {step === "subscribe" ? (
            <div className="purchase-step">
              <h2 id={titleId} className="font-unbounded text-2xl text-white">
                Подписка
              </h2>
              <SiteSelect
                label="Тариф"
                value={selectedTariff}
                placeholder="Выберите"
                options={PURCHASE_TARIFFS.map((item) => ({
                  value: item.id,
                  label: `${item.lane} · ${item.label} — ${item.priceLabel}`,
                }))}
                onChange={(id) => setSelectedTariff(id as PurchaseTariffId)}
              />
              <p className="purchase-price font-unbounded text-xl text-white">{tariff.priceLabel}</p>
              <label className="purchase-addon">
                <input type="checkbox" checked={onlineAddon} onChange={(event) => setOnlineAddon(event.target.checked)} />
                <span>
                  <strong>{PURCHASE_ONLINE_ADDON.title}</strong>
                  <span>
                    {PURCHASE_ONLINE_ADDON.detail} {PURCHASE_ONLINE_ADDON.priceLabel}
                  </span>
                </span>
              </label>
              {promoNotice ? <p className="purchase-error">{promoNotice}</p> : null}
              {payNotice ? <p className="purchase-error">{payNotice}</p> : null}
              <div className="purchase-pay-row">
                <label className="purchase-code-field">
                  <input
                    value={promoCode}
                    placeholder="Промокод"
                    aria-label="Промокод"
                    onChange={(event) => {
                      setPromoCode(event.target.value);
                      setPromoNotice("");
                    }}
                  />
                </label>
                <Button
                  type="button"
                  variant="stroke"
                  size="md"
                  className="uppercase"
                  onClick={() => setPromoNotice(promoCode.trim() ? "Промокод принят." : "Введите промокод.")}
                >
                  Применить
                </Button>
                <Button
                  type="button"
                  variant="primary"
                  size="md"
                  className="purchase-pay uppercase"
                  onClick={() => setPayNotice(PURCHASE_PAYMENT_NOTICE)}
                >
                  Оплатить
                </Button>
              </div>
            </div>
          ) : null}
        </div>
      )}
    </dialog>
  );
}

function SiteSelect({
  label,
  value,
  placeholder,
  options,
  error,
  onChange,
}: {
  label: string;
  value: string;
  placeholder: string;
  options: { value: string; label: string }[];
  error?: string;
  onChange: (value: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const current = options.find((item) => item.value === value);

  useEffect(() => {
    if (!open) return;
    const onPointer = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div className="purchase-field" ref={rootRef}>
      <span>{label}</span>
      <div className={open ? "purchase-select is-open" : "purchase-select"}>
        <button
          type="button"
          className="purchase-select-trigger"
          aria-expanded={open}
          aria-haspopup="listbox"
          onClick={() => setOpen((currentOpen) => !currentOpen)}
        >
          <span>{current?.label ?? placeholder}</span>
          <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden>
            <path d="M2 4.5 6 8.5 10 4.5" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
          </svg>
        </button>
        {open ? (
          <ul className="purchase-select-menu" role="listbox" aria-label={label}>
            {options.map((item) => (
              <li key={item.value}>
                <button
                  type="button"
                  role="option"
                  aria-selected={item.value === value}
                  onClick={() => {
                    onChange(item.value);
                    setOpen(false);
                  }}
                >
                  {item.label}
                </button>
              </li>
            ))}
          </ul>
        ) : null}
      </div>
      {error ? <p className="purchase-error">{error}</p> : null}
    </div>
  );
}

function Field({
  label,
  value,
  error,
  onChange,
  type = "text",
}: {
  label: string;
  value: string;
  error?: string;
  onChange: (value: string) => void;
  type?: string;
}) {
  return (
    <label className="purchase-field">
      <span>{label}</span>
      <input type={type} value={value} onChange={(event) => onChange(event.target.value)} />
      {error ? <p className="purchase-error">{error}</p> : null}
    </label>
  );
}
