import type { Metadata } from "next";

import { DocPageShell } from "@/components/doc-page-shell";
import { RegistrationScreen } from "@/screens/auth/registration-screen";
import "@/screens/landing/styles.css";
import "@/screens/auth/auth-pages.css";

export const metadata: Metadata = {
  title: "Регистрация в личный кабинет — Мастер меча",
  description: "Регистрация в кабинет школы «Мастер меча» по ссылке администратора через OnlyID.",
};

type PageProps = {
  params: Promise<{ token: string }>;
  searchParams: Promise<{ register_error?: string }>;
};

export default async function RegistrationPage({ params, searchParams }: PageProps) {
  const { token } = await params;
  const query = await searchParams;
  return (
    <DocPageShell>
      <RegistrationScreen token={token} registerError={query.register_error ?? ""} />
    </DocPageShell>
  );
}
