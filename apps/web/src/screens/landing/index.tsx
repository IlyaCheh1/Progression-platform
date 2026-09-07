"use client";

import dynamic from "next/dynamic";
import Header from "@/components/header-public";
import Hero from "@/screens/landing/hero";
import { AudienceProvider, useAudience } from "@/hooks/landing/useAudience";
import type { AudienceMode } from "@/lib/audience";
import "./styles.css";

const Directions = dynamic(() => import("@/screens/landing/directions"), {
  loading: () => <section id="directions" className="min-h-screen" style={{ background: "var(--void)" }} aria-hidden />,
});
const Trainers = dynamic(() => import("@/screens/landing/trainers"));
const TeamBoard = dynamic(() => import("@/screens/landing/team-board"));
const Services = dynamic(() => import("@/screens/landing/services"));
const Promos = dynamic(() => import("@/screens/landing/promos"));
const Arenda = dynamic(() => import("@/screens/landing/arenda"));
const Tariffs = dynamic(() => import("@/screens/landing/tariffs"));
const Articles = dynamic(() => import("@/screens/landing/articles"));
const Questions = dynamic(() => import("@/screens/landing/questions"));
const RpgBlock = dynamic(() => import("@/screens/landing/rpg"));
const Join = dynamic(() => import("@/screens/landing/join"));
const Footer = dynamic(() => import("@/components/footer"));

function LandingBody() {
  const { isKids } = useAudience();

  return (
    <div
      className="noise-overlay w-full overflow-x-clip"
      style={{ background: "var(--void)", color: "white", minHeight: "100vh" }}
    >
      <Header />
      <main>
        <Hero />
        <Directions />
        <Trainers />
        {!isKids ? <TeamBoard /> : null}
        <Services />
        <Promos />
        <Arenda />
        <Tariffs />
        <Articles />
        <Questions />
        <div className="landing-end-zone relative">
          <div className="landing-end-glow pointer-events-none absolute inset-0" aria-hidden />
          {!isKids ? <RpgBlock /> : null}
          <Join />
          <Footer />
        </div>
      </main>
    </div>
  );
}

export default function LandingScreen({ initialAudience = "adults" }: { initialAudience?: AudienceMode }) {
  return (
    <AudienceProvider initialMode={initialAudience}>
      <LandingBody />
    </AudienceProvider>
  );
}
