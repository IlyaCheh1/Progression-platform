import Image from "next/image";
import { cn } from "@/lib/utils";

export const COIN_SRC = "/media/ui/coin.webp";

type GoldCoinProps = {
  className?: string;
  alt?: string;
};

/** Иконка внутренней валюты — золотые монеты. */
export default function GoldCoin({ className, alt = "" }: GoldCoinProps) {
  return (
    <Image
      src={COIN_SRC}
      alt={alt}
      width={64}
      height={64}
      sizes="20px"
      className={cn("inline-block h-4 w-4 shrink-0 object-contain", className)}
      aria-hidden={alt === "" ? true : undefined}
      draggable={false}
    />
  );
}
