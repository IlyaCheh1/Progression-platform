import LandingScreen from "@/screens/landing";
import { audienceFromSearch } from "@/lib/audience";

type HomePageProps = {
  searchParams: Promise<{ audience?: string | string[] }>;
};

export default async function HomePage({ searchParams }: HomePageProps) {
  const params = await searchParams;
  return <LandingScreen initialAudience={audienceFromSearch(params.audience)} />;
}
