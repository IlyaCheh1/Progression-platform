import Image from "next/image";
import { cn } from "@/lib/utils";

export const LOGO_SRC = "/media/logo.webp";
export const LOGO_SIZE_SCALE = 1.5;
const LOGO_INTRINSIC_WIDTH = 335;
const LOGO_INTRINSIC_HEIGHT = 281;

type AppLogoProps = {
  size?: number;
  className?: string;
  priority?: boolean;
};

export default function AppLogo({ size = 84, className, priority = false }: AppLogoProps) {
  const height = Math.round(size * LOGO_SIZE_SCALE);
  const width = Math.round((height * LOGO_INTRINSIC_WIDTH) / LOGO_INTRINSIC_HEIGHT);

  return (
    <Image
      src={LOGO_SRC}
      alt="Мастер меча"
      width={width}
      height={height}
      priority={priority}
      sizes={`${width}px`}
      className={cn("h-auto w-auto object-contain", className)}
      style={{ height, width: "auto" }}
      draggable={false}
    />
  );
}
