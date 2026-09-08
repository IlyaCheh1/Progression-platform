import type { Metadata } from "next";
import LandingScreen from "@/screens/landing";
import { KIDS_WUSHU } from "@/lib/landing/kids-wushu";

export const metadata: Metadata = {
  title: KIDS_WUSHU.school,
  description: `${KIDS_WUSHU.lead} ${KIDS_WUSHU.cta}`,
  alternates: { canonical: "/kids" },
};

export default function KidsPage() {
  return <LandingScreen initialAudience="kids" />;
}
