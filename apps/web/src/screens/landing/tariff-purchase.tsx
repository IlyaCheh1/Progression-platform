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
  const [sectionKey, setSectionKey] = useState(SECTIONS[0]?.key ?? "ushu");
  const [selectedTariff, setSelectedTariff] = useState(tariffId);
  const [onlineAddon, setOnlineAddon] = useState(false);
  const [promoOpen, setPromoOpen] = useState(false);
  const [promoCode, setPromoCode] = useState("");
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
                <label className="purchase-field">
                  <span>Пол</span>
                  <select
                    value={form.gender}
                    onChange={(event) => setForm({ ...form, gender: event.target.value as PurchaseGender | "" })}
                  >
                    <option value="">Выберите</option>
                    <option value="female">Женский</option>
                    <option value="male">Мужской</option>
                  </select>
                  {formErrors.gender ? <p className="purchase-error">{formErrors.gender}</p> : null}
                </label>
              </div>
              <Button type="submit" variant="primary" size="md" className="uppercase">
                Далее
              </Button>
            </form>
          ) : null}

          {step === "section" ? (
            <div>
              <h2 id={titleId} className="font-unbounded text-2xl text-white">
                Секция
              </h2>
              <div className="purchase-sections" role="listbox" aria-label="Секции">
                {SECTIONS.map((section) => {
                  const selected = section.key === sectionKey;
                  return (
                    <button
                      key={section.key}
                      type="button"
                      role="option"
                      aria-selected={selected}
                      className={`purchase-section ${selected ? "is-active" : ""}`}
                      onClick={() => setSectionKey(section.key)}
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
              <Button type="button" variant="primary" size="md" className="uppercase" onClick={() => setStep("subscribe")}>
                Далее
              </Button>
            </div>
          ) : null}

          {step === "subscribe" ? (
            <div>
              <h2 id={titleId} className="font-unbounded text-2xl text-white">
                Подписка
              </h2>
              <p className="text-sm text-white/70">
                Домашний клуб: <span className="text-white">Школа</span>
              </p>
              <label className="purchase-field">
                <span>Тариф</span>
                <select value={selectedTariff} onChange={(event) => setSelectedTariff(event.target.value as PurchaseTariffId)}>
                  {PURCHASE_TARIFFS.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.lane} · {item.label} — {item.priceLabel}
                    </option>
                  ))}
                </select>
              </label>
              <p className="font-unbounded text-xl text-white">{tariff.priceLabel}</p>
              <label className="purchase-addon">
                <input type="checkbox" checked={onlineAddon} onChange={(event) => setOnlineAddon(event.target.checked)} />
                <span>
                  <strong>{PURCHASE_ONLINE_ADDON.title}</strong>
                  <span>
                    {PURCHASE_ONLINE_ADDON.detail} {PURCHASE_ONLINE_ADDON.priceLabel}
                  </span>
                </span>
              </label>
              <Button type="button" variant="stroke" size="md" className="uppercase" onClick={() => setPromoOpen(true)}>
                Промокод
              </Button>
              {payNotice ? <p className="purchase-error">{payNotice}</p> : null}
              <Button
                type="button"
                variant="primary"
                size="lg"
                className="uppercase"
                onClick={() => setPayNotice(PURCHASE_PAYMENT_NOTICE)}
              >
                Оплатить
              </Button>
              {promoOpen ? (
                <div className="purchase-promo" role="dialog" aria-label="Промокод">
                  <label className="purchase-field">
                    <span>Промокод</span>
                    <input value={promoCode} onChange={(event) => setPromoCode(event.target.value)} />
                  </label>
                  <Button type="button" variant="primary" size="md" className="uppercase" onClick={() => setPromoOpen(false)}>
                    Готово
                  </Button>
                </div>
              ) : null}
            </div>
          ) : null}
        </div>
      )}
    </dialog>
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
