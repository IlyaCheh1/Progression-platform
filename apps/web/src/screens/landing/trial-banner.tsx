"use client";

import { useState } from "react";
import Button from "@/components/ui/button";
import TariffPurchase from "@/screens/landing/tariff-purchase";

export default function TrialBanner() {
  const [open, setOpen] = useState(false);

  return (
    <section id="trial" className="relative px-4 py-16 md:px-6 md:py-24">
      <div className="mx-auto max-w-6xl">
        <div className="landing-frame">
          <div className="trial-banner">
            <div>
              <h2 className="font-unbounded text-3xl font-medium md:text-5xl">Пробное занятие</h2>
              <p className="landing-frame-copy mt-3 max-w-xl">
                Первый выход: знакомство с тренером, техникой и залом.
              </p>
              <p className="trial-price">1 000 ₽</p>
              <Button type="button" variant="primary" size="lg" className="uppercase" onClick={() => setOpen(true)}>
                Записаться
              </Button>
            </div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/media/formats/group.webp" alt="" />
          </div>
        </div>
      </div>
      {open ? <TariffPurchase tariffId="trial" onClose={() => setOpen(false)} /> : null}
    </section>
  );
}
