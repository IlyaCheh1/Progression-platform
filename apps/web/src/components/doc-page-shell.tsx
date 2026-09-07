import type { ReactNode } from "react";
import Footer from "@/components/footer";
import Header from "@/components/header-public";
import { AudienceProvider } from "@/hooks/landing/useAudience";

type DocPageShellProps = {
  children: ReactNode;
};

export function DocPageShell({ children }: DocPageShellProps) {
  return (
    <AudienceProvider>
      <div
        className="noise-overlay flex min-h-screen w-full flex-col overflow-x-clip"
        style={{ background: "var(--void)", color: "white" }}
      >
        <Header />
        <main className="public-main flex-1">
          <article className="og-doc-prose mx-auto max-w-3xl px-4 pb-16 pt-4 md:px-6 md:pb-24">{children}</article>
        </main>
        <Footer />
      </div>
    </AudienceProvider>
  );
}
