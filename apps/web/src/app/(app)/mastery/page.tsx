"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { fetchMastery, type MasteryTrack } from "@/lib/school-api";
import { loadSession } from "@/lib/session";
import { routes } from "@/lib/routes";

const weaponLabels: Record<string, string> = {
  spada_a_uno_mano: "Одноручный меч",
  due_spade: "Два меча",
  spada_e_scudo: "Меч и щит",
  spada_a_due_mani: "Двуручный меч",
  spadone: "Спадоне",
  acia_alabarda: "Топор и алебарда",
  spiedo_partesana: "Копьё и протазан",
  spiedo_e_scudo: "Копьё и щит",
};

export default function MasteryPage() {
  const router = useRouter();
  const [tracks, setTracks] = useState<MasteryTrack[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    const user = loadSession();
    if (!user) {
      router.replace(routes.login);
      return;
    }
    fetchMastery(user)
      .then(setTracks)
      .catch(() => setError("Не удалось загрузить мастерство."));
  }, [router]);

  return (
    <main className="min-h-screen bg-mos-bg px-4 py-8 text-mos-text">
      <div className="mx-auto max-w-3xl">
        <Link href={routes.home} className="text-sm text-mos-accent underline">
          ← Профиль
        </Link>
        <h1 className="mt-4 font-cinzel text-2xl">Мастерство оружия</h1>
        <p className="mt-2 text-sm opacity-70">Восемь путей — integer ledger, rank floor и decay.</p>
        {error && <p className="mt-4 text-red-400">{error}</p>}
        <ul className="mt-6 space-y-3">
          {tracks.map((t) => (
            <li key={t.weaponKey} className="rounded border border-mos-border bg-mos-panel/40 p-4">
              <div className="flex justify-between font-golos text-sm">
                <span>{weaponLabels[t.weaponKey] ?? t.weaponKey}</span>
                <span>Rank {t.rank}</span>
              </div>
              <div className="mt-2 h-2 rounded bg-black/30">
                <div
                  className="h-2 rounded bg-mos-accent"
                  style={{ width: `${Math.min(100, (t.points / 100) * 100)}%` }}
                />
              </div>
              <p className="mt-2 text-xs opacity-60">
                {t.points.toFixed(1)} pts · floor {(t.floorUnits / 10000).toFixed(1)} pts
              </p>
            </li>
          ))}
        </ul>
      </div>
    </main>
  );
}
