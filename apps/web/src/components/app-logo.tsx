import { cn } from "@/lib/utils";

export const LOGO_SRC = "/media/logo.png";
export const LOGO_SIZE_SCALE = 1.5;

type AppLogoProps = {
  size?: number;
  className?: string;
  priority?: boolean;
};

export default function AppLogo({ size = 84, className, priority = false }: AppLogoProps) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={LOGO_SRC}
      alt="Мастер меча"
      className={cn("h-auto w-auto object-contain", className)}
      style={{ height: size * LOGO_SIZE_SCALE }}
      draggable={false}
      fetchPriority={priority ? "high" : "auto"}
    />
  );
}
