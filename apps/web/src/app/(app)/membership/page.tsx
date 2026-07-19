"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { checkoutMembership, fetchMembership, fetchTariffs, type Tariff } from "@/lib/school-api";
import { loadSession } from "@/lib/session";
import { routes } from "@/lib/routes";
import { SCHOOL_API } from "@/lib/utils";

export default function MembershipPage() {
  const router = useRouter();
  const [tariffs, setTariffs] = useState<Tariff[]>([]);
  const [active, setActive] = useState(false);
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const user = loadSession();
    if (!user) {
      router.replace(routes.login);
      return;
    }
    fetchTariffs().then(setTariffs).catch(() => setError("Тарифы недоступны."));
    fetchMembership(user)
      .then((m) => setActive(m.active))
      .catch(() => undefined);
  }, [router]);

  async function buy(tariffKey: string) {
    const user = loadSession();
    if (!user) return;
    setBusy(tariffKey);
    setError("");
    try {
      const pay = await checkoutMembership(user, tariffKey);
      if (pay.confirmationUrl) {
        window.open(pay.confirmationUrl, "_blank");
        await fetch(`${SCHOOL_API}/v1/webhooks/yoomoney`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            event: "payment.succeeded",
            eventId: `sandbox-${pay.id}`,
            object: { id: pay.providerPaymentId ?? pay.id },
          }),
        });
        const m = await fetchMembership(user);
        setActive(m.active);
      }
    } catch {
      setError("Ошибка оплаты.");
    } finally {
      setBusy("");
    }
  }

  return (
    <main className="min-h-screen bg-mos-bg px-4 py-8 text-mos-text">
      <div className="mx-auto max-w-lg">
        <Link href={routes.home} className="text-sm text-mos-accent underline">
          ← Профиль
        </Link>
        <h1 className="mt-4 font-cinzel text-2xl">Абонемент</h1>
        {active && <p className="mt-2 text-green-400">Активный абонемент</p>}
        {error && <p className="mt-2 text-red-400">{error}</p>}
        <ul className="mt-6 space-y-4">
          {tariffs.map((t) => (
            <li key={t.key} className="rounded border border-mos-border p-4">
              <h2 className="font-golos font-semibold">{t.title}</h2>
              <p className="text-sm">{(t.amountMinor / 100).toLocaleString("ru-RU")} ₽</p>
              <button
                type="button"
                disabled={busy === t.key || active}
                onClick={() => void buy(t.key)}
                className="mt-3 rounded bg-mos-accent px-4 py-2 text-sm text-black disabled:opacity-50"
              >
                Оплатить через ЮMoney
              </button>
            </li>
          ))}
        </ul>
      </div>
    </main>
  );
}
