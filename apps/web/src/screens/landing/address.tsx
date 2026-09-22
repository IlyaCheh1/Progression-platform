"use client";

import { useRef } from "react";
import { useRevealFade } from "@/hooks/landing/useRevealFade";
import {
  SCHOOL_ADDRESS,
  SCHOOL_ADDRESS_ROUTE,
  SCHOOL_ENTRANCE,
  SCHOOL_ENTRANCE_LABEL,
  schoolAddressMapSrc,
} from "@/lib/landing/school-address";

export default function Address() {
  const sectionRef = useRef<HTMLElement>(null);
  useRevealFade(sectionRef);

  return (
    <section id="address" ref={sectionRef} className="relative px-4 py-16 md:px-6 md:py-24" style={{ background: "var(--void)" }}>
      <div className="landing-frame mx-auto max-w-6xl">
        <div className="landing-frame-head reveal-fade">
          <h2 className="font-unbounded text-3xl font-medium md:text-5xl">Адрес школы</h2>
        </div>
        <div className="school-address-layout reveal-fade mt-8">
          <div className="school-address-map">
            <iframe
              title={`Карта: ${SCHOOL_ADDRESS}`}
              src={schoolAddressMapSrc()}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              allowFullScreen
            />
          </div>
          <div className="school-address-copy font-golos">
            <p className="school-address-line">{SCHOOL_ADDRESS}</p>
            <p>{SCHOOL_ADDRESS_ROUTE}</p>
            <p className="school-address-entry">
              <span>{SCHOOL_ENTRANCE_LABEL}</span>
              {SCHOOL_ENTRANCE}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
