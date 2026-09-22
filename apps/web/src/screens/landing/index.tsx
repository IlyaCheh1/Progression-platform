"use client";

import dynamic from "next/dynamic";
import Header from "@/components/header-public";
import Directions from "@/screens/landing/directions";
import Hero from "@/screens/landing/hero";
import { AudienceProvider, useAudience } from "@/hooks/landing/useAudience";
import type { AudienceMode } from "@/lib/audience";
import "./styles.css";

const Trainers = dynamic(() => import("@/screens/landing/trainers"));
const TeamBoard = dynamic(() => import("@/screens/landing/team-board"));
const Services = dynamic(() => import("@/screens/landing/services"));
const Promos = dynamic(() => import("@/screens/landing/promos"));
const Arenda = dynamic(() => import("@/screens/landing/arenda"));
const Tariffs = dynamic(() => import("@/screens/landing/tariffs"));
const Address = dynamic(() => import("@/screens/landing/address"));
const Articles = dynamic(() => import("@/screens/landing/articles"));
const Answers = dynamic(() => import("@/screens/landing/answers"));
const TrialBanner = dynamic(() => import("@/screens/landing/trial-banner"));
const CallbackBlock = dynamic(() => import("@/screens/landing/callback"));
const RpgBlock = dynamic(() => import("@/screens/landing/rpg"));
const Join = dynamic(() => import("@/screens/landing/join"));
const Footer = dynamic(() => import("@/components/footer"));

/** Set true to put the RPG character block back on the landing page. */
const SHOW_LANDING_RPG = false;

function LandingBody() {
  const { isKids } = useAudience();

  return (
    <div
      className="noise-overlay w-full overflow-x-clip"
      style={{ background: "var(--void)", color: "white", minHeight: "100vh" }}
    >
      <Header />
      <main>
        {isKids ? <Hero /> : <Directions />}
        {isKids ? <Trainers /> : null}
        {!isKids ? <TeamBoard /> : null}
        <Services />
        {!isKids ? <Arenda /> : null}
        <Tariffs />
        <Promos />
        <Address />
        <Articles />
        <Answers />
        <div className="landing-end-zone relative">
          <div className="landing-end-glow pointer-events-none absolute inset-0" aria-hidden />
          {SHOW_LANDING_RPG && !isKids ? <RpgBlock /> : null}
          <Join />
          {!isKids ? <TrialBanner /> : null}
          <CallbackBlock />
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
