"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import WitcherNav from "@/components/witcher-nav";
import { RoleSwitch } from "@/components/role-switch";
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
      <div className="mx-auto max-w-6xl px-4 pt-4">
        <RoleSwitch user={user} />
      </div>
      {children}
    </div>
  );
}
