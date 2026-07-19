"use client";

import dynamic from "next/dynamic";
import Header from "@/components/header-public";
import Hero from "@/screens/landing/hero";
import "./styles.css";

const Directions = dynamic(() => import("@/screens/landing/directions"), {
  loading: () => <section id="directions" className="min-h-screen" style={{ background: "var(--void)" }} aria-hidden />,
});
const Trainers = dynamic(() => import("@/screens/landing/trainers"));
const Services = dynamic(() => import("@/screens/landing/services"));
const Tariffs = dynamic(() => import("@/screens/landing/tariffs"));
const RpgBlock = dynamic(() => import("@/screens/landing/rpg"));
const Join = dynamic(() => import("@/screens/landing/join"));
const Footer = dynamic(() => import("@/components/footer"));

export default function LandingScreen() {
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
        <Services />
        <Tariffs />
        <div className="landing-end-zone relative">
          <div className="landing-end-glow pointer-events-none absolute inset-0" aria-hidden />
          <RpgBlock />
          <Join />
          <Footer />
        </div>
      </main>
    </div>
  );
}
