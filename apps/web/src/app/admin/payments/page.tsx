"use client";

import { useEffect, useState } from "react";
import {
  fetchPaymentProvider,
  fetchPayments,
  type PaymentListRow,
} from "@/lib/school-api";
import { loadSession } from "@/lib/session";

export default function AdminPaymentsPage() {
  const [rows, setRows] = useState<PaymentListRow[]>([]);
  const [live, setLive] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const s = loadSession();
    if (!s) return;
    void Promise.all([fetchPayments(s), fetchPaymentProvider()])
      .then(([payments, provider]) => {
        setRows(payments);
        setLive(provider.live);
      })
      .catch(() => setError("Не удалось загрузить платежи."));
  }, []);

  return (
    <main className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="font-display text-3xl text-mos-text">Оплаты (ЮKassa)</h1>
      <p className="mt-2 text-sm text-mos-muted">
        Провайдер: ЮKassa · режим:{" "}
        <span className={live ? "text-mos-amber" : "text-mos-muted"}>{live ? "live" : "sandbox"}</span>
      </p>
      {error && <p className="mt-4 text-sm text-[#c45c2a]">{error}</p>}
      <div className="mt-6 overflow-x-auto border border-mos-line/40">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-mos-line/40 text-xs uppercase tracking-widest text-mos-muted">
            <tr>
              <th className="px-3 py-2">ID</th>
              <th className="px-3 py-2">Статус</th>
              <th className="px-3 py-2">Сумма</th>
              <th className="px-3 py-2">Провайдер</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((p) => (
              <tr key={p.id} className="border-b border-mos-line/20">
                <td className="px-3 py-2 font-mono text-xs text-mos-muted">{p.id}</td>
                <td className="px-3 py-2">{p.status}</td>
                <td className="px-3 py-2">
                  {(p.amountMinor / 100).toLocaleString("ru-RU")} {p.currency ?? "RUB"}
                </td>
                <td className="px-3 py-2 text-mos-muted">{p.providerPaymentId ?? "—"}</td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={4} className="px-3 py-6 text-mos-muted">
                  Платежей пока нет
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </main>
  );
}
