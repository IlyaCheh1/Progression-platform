"use client";

import { useState } from "react";
import Link from "next/link";
import Button from "@/components/ui/button";
import { purchasePhone } from "@/lib/landing/tariff-purchase";

export default function CallbackBlock() {
  const [phone, setPhone] = useState("");
  const [personalData, setPersonalData] = useState(false);
  const [infoConsent, setInfoConsent] = useState(false);
  const [phoneError, setPhoneError] = useState("");
  const [consentError, setConsentError] = useState("");
  const [done, setDone] = useState(false);

  function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    const phoneOk = purchasePhone(phone) !== null;
    const consentOk = personalData && infoConsent;
    setPhoneError(phoneOk ? "" : "Укажите телефон в формате +7 и 10 цифр.");
    setConsentError(consentOk ? "" : "Нужны обе отметки о согласии.");
    if (!phoneOk || !consentOk) return;
    setPhone("");
    setPersonalData(false);
    setInfoConsent(false);
    setDone(true);
  }

  return (
    <section id="callback" className="relative px-4 pb-16 md:px-6 md:pb-24">
      <div className="mx-auto max-w-6xl">
        <div className="landing-frame">
          {done ? (
            <p className="landing-frame-copy" role="status">
              Если нужен звонок, напишите в{" "}
              <Link href="/contact" className="callback-doc">
                контакты
              </Link>
              .
            </p>
          ) : (
            <form className="callback-layout" onSubmit={onSubmit} noValidate>
              <div>
                <h2 className="font-unbounded text-3xl font-medium md:text-5xl">Остались вопросы?</h2>
                <div className="callback-phone-row">
                  <label className="callback-phone">
                    <span className="sr-only">Телефон</span>
                    <input
                      type="tel"
                      name="phone"
                      autoComplete="tel"
                      inputMode="tel"
                      placeholder="+7"
                      value={phone}
                      onChange={(event) => setPhone(event.target.value)}
                      className="hall-rental-input"
                    />
                  </label>
                  <Button type="submit" variant="primary" size="lg" className="uppercase">
                    Перезвоните
                  </Button>
                </div>
                {phoneError ? <p className="callback-error">{phoneError}</p> : null}
              </div>
              <div className="callback-consents">
                <label className="callback-check">
                  <input
                    type="checkbox"
                    name="personal-data"
                    checked={personalData}
                    onChange={(event) => setPersonalData(event.target.checked)}
                  />
                  <span>
                    Согласен на{" "}
                    <Link href="/legal/personal-data" className="callback-doc">
                      обработку персональных данных
                    </Link>
                  </span>
                </label>
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
                {consentError ? <p className="callback-error">{consentError}</p> : null}
              </div>
            </form>
          )}
        </div>
      </div>
    </section>
  );
}
