import { permanentRedirect } from "next/navigation";
import LandingScreen from "@/screens/landing";
import { audienceFromSearch } from "@/lib/audience";

type HomePageProps = {
  searchParams: Promise<{ audience?: string | string[] }>;
};

export default async function HomePage({ searchParams }: HomePageProps) {
  const params = await searchParams;
  if (audienceFromSearch(params.audience) === "kids") {
    permanentRedirect("/kids");
  }
  return <LandingScreen initialAudience="adults" />;
}
