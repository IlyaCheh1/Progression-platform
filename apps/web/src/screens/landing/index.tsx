"use client";

import Header from "@/components/header-public";
import Hero from "@/screens/landing/hero";
import Directions from "@/screens/landing/directions";
import Services from "@/screens/landing/services";
import Tariffs from "@/screens/landing/tariffs";
import RpgBlock from "@/screens/landing/rpg";
import Join from "@/screens/landing/join";
import Footer from "@/components/footer";

export default function LandingScreen() {
  return (
    <div className="relative w-full overflow-x-clip bg-mos-bg text-mos-text">
      <Header />
      <main>
        <Hero />
        <Directions />
        <Services />
        <Tariffs />
        <RpgBlock />
        <Join />
      </main>
      <Footer />
    </div>
  );
}
