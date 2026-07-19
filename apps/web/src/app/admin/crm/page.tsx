"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { fetchLeads } from "@/lib/school-api";
import { hasRole, loadSession } from "@/lib/session";
import { routes } from "@/lib/routes";

type Lead = {
  id: string;
  name: string;
  stage: string;
  phone?: string;
  direction?: string;
};

export default function AdminCrmPage() {
  const router = useRouter();
  const [leads, setLeads] = useState<Lead[]>([]);

  useEffect(() => {
    const user = loadSession();
    if (!user || !hasRole(user.roles, "administrator")) {
      router.replace(routes.login);
      return;
    }
    fetchLeads(user)
      .then((rows) => setLeads(rows as Lead[]))
      .catch(() => setLeads([]));
  }, [router]);

  return (
    <main className="min-h-screen bg-mos-bg px-4 py-8 text-mos-text">
      <div className="mx-auto max-w-3xl">
        <Link href={routes.admin} className="text-sm underline">
          ← Админ
        </Link>
        <h1 className="mt-4 font-cinzel text-2xl">CRM — лиды</h1>
        <ul className="mt-6 space-y-2">
          {leads.map((l) => (
            <li key={l.id} className="rounded border border-mos-border p-3 text-sm">
              <strong>{l.name}</strong> · {l.stage} · {l.direction ?? "—"}
            </li>
          ))}
          {leads.length === 0 && <li className="opacity-60">Лидов пока нет</li>}
        </ul>
      </div>
    </main>
  );
}
