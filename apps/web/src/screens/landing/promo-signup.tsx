"use client";

import { useState } from "react";
import Button from "@/components/ui/button";
import type { PurchaseTariffId } from "@/lib/landing/tariff-purchase";
import TariffPurchase from "@/screens/landing/tariff-purchase";

export default function PromoSignup({ tariffId }: { tariffId: PurchaseTariffId }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button
        type="button"
        variant="primary"
        size="lg"
        className="promo-detail-signup"
        data-promo-signup
        onClick={() => setOpen(true)}
      >
        Купить
      </Button>
      {open ? <TariffPurchase tariffId={tariffId} onClose={() => setOpen(false)} /> : null}
    </>
  );
}
