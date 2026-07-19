import type { ReactNode } from "react";
import Footer from "@/components/footer";
import Header from "@/components/header-public";

type DocPageShellProps = {
  children: ReactNode;
};

export function DocPageShell({ children }: DocPageShellProps) {
  return (
    <div
      className="noise-overlay flex min-h-screen w-full flex-col overflow-x-clip"
      style={{ background: "var(--void)", color: "white" }}
    >
      <Header />
      <main className="flex-1 pt-24">
        <article className="og-doc-prose mx-auto max-w-3xl px-4 py-16 md:px-6 md:py-24">{children}</article>
      </main>
      <Footer />
    </div>
  );
}
