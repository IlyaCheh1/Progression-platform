"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import WitcherNav from "@/components/witcher-nav";
import { loadSession, type SessionUser } from "@/lib/session";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<SessionUser | null>(null);

  useEffect(() => {
    const s = loadSession();
    if (!s) {
      router.replace("/login");
      return;
    }
    setUser(s);
  }, [router]);

  if (!user) {
    return <main className="grid min-h-screen place-items-center text-mos-muted">Загрузка…</main>;
  }

  return (
    <div className="min-h-screen bg-mos-bg">
      <WitcherNav />
      {children}
    </div>
  );
}
