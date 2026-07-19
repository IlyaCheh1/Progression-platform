"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { SCHOOL_API } from "@/lib/utils";
import { authHeaders, hasRole, loadSession } from "@/lib/session";
import { routes } from "@/lib/routes";

type ImportBatch = {
  id: string;
  fileName: string;
  status: string;
  rows: { rowIndex: number; login: string; name: string; status: string; reason?: string }[];
};

export default function AdminImportPage() {
  const router = useRouter();
  const [batches, setBatches] = useState<ImportBatch[]>([]);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const user = loadSession();
    if (!user || !hasRole(user.roles, "administrator")) {
      router.replace(routes.login);
      return;
    }
    void reload(user);
  }, [router]);

  async function reload(user: NonNullable<ReturnType<typeof loadSession>>) {
    const res = await fetch(`${SCHOOL_API}/v1/import/batches`, { headers: authHeaders(user) });
    if (res.ok) setBatches(await res.json());
  }

  async function stageDemo() {
    const user = loadSession();
    if (!user) return;
    const res = await fetch(`${SCHOOL_API}/v1/import/stage`, {
      method: "POST",
      headers: authHeaders(user),
      body: JSON.stringify({
        fileName: "demo-import.json",
        rows: [
          { rowIndex: 1, login: "staging.user@local", name: "Staging User" },
        ],
      }),
    });
    if (res.ok) {
      setMessage("Batch staged");
      await reload(user);
    }
  }

  async function commit(id: string) {
    const user = loadSession();
    if (!user) return;
    const res = await fetch(`${SCHOOL_API}/v1/import/batches/${id}/commit`, {
      method: "POST",
      headers: authHeaders(user),
    });
    if (res.ok) {
      setMessage(`Committed ${id}`);
      await reload(user);
    }
  }

  return (
    <main className="mx-auto max-w-3xl px-4 py-8 text-mos-text">
      <Link href={routes.admin} className="text-sm underline">
        ← Админ
      </Link>
      <h1 className="mt-4 font-cinzel text-2xl">Import staging</h1>
      {message && <p className="mt-2 text-green-400">{message}</p>}
      <button type="button" onClick={() => void stageDemo()} className="og-btn og-btn-primary og-btn-md mt-4">
        Stage demo row
      </button>
      <ul className="mt-6 space-y-4">
        {batches.map((b) => (
          <li key={b.id} className="rounded border border-mos-line/40 p-4">
            <p className="font-golos text-sm">
              {b.fileName} · {b.status} · {b.id}
            </p>
            <p className="text-xs opacity-60">{b.rows.length} rows</p>
            {b.status !== "committed" ? (
              <button type="button" onClick={() => void commit(b.id)} className="og-btn og-btn-secondary og-btn-sm mt-2">
                Commit
              </button>
            ) : null}
          </li>
        ))}
      </ul>
    </main>
  );
}
