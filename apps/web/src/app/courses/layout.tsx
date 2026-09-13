import type { ReactNode } from "react";
import Footer from "@/components/footer";
import Header from "@/components/header-public";
import { AudienceProvider } from "@/hooks/landing/useAudience";
import "@/screens/landing/styles.css";

export default function CoursesLayout({ children }: { children: ReactNode }) {
  return (
    <AudienceProvider>
      <div
        className="noise-overlay flex min-h-screen w-full flex-col overflow-x-clip"
        style={{ background: "var(--void)", color: "white" }}
      >
        <Header />
        <div className="public-main flex-1">{children}</div>
        <Footer />
      </div>
    </AudienceProvider>
  );
}
