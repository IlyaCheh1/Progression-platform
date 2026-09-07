import type { ReactNode } from "react";
import Footer from "@/components/footer";
import Header from "@/components/header-public";
import { AudienceProvider } from "@/hooks/landing/useAudience";
import "@/screens/landing/styles.css";

type PublicPageShellProps = {
  children: ReactNode;
  narrow?: boolean;
};

export function PublicPageShell({ children, narrow = false }: PublicPageShellProps) {
  return (
    <AudienceProvider>
      <div
        className="noise-overlay flex min-h-screen w-full flex-col overflow-x-clip"
        style={{ background: "var(--void)", color: "white" }}
      >
        <Header />
        <main className={`flex-1 pt-24 ${narrow ? "og-doc-prose mx-auto max-w-3xl px-4 py-16 md:px-6 md:py-24" : "px-6 py-16 md:py-24"}`}>
          {children}
        </main>
        <Footer />
      </div>
    </AudienceProvider>
  );
}
