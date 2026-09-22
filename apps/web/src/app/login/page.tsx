import type { Metadata } from "next";
import { Suspense } from "react";

import { DocPageShell } from "@/components/doc-page-shell";
import { CabinetLogin } from "@/screens/auth/cabinet-login";
import "@/screens/landing/styles.css";
import "@/screens/auth/auth-pages.css";

export const metadata: Metadata = {
  title: "Вход в личный кабинет — Мастер меча",
  description: "Вход в личный кабинет школы «Мастер меча» через OnlyID.",
};

export default function LoginPage() {
  return (
    <DocPageShell>
      <Suspense fallback={<p className="auth-note">Загрузка…</p>}>
        <CabinetLogin />
      </Suspense>
    </DocPageShell>
  );
}
