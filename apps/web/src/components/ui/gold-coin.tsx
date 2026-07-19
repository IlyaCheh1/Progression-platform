import { cn } from "@/lib/utils";

type GoldCoinProps = {
  className?: string;
  alt?: string;
};

/** Иконка внутренней валюты — золотые монеты. */
export default function GoldCoin({ className, alt = "" }: GoldCoinProps) {
  return (
    // Decorative currency glyph; parent provides the accessible name when needed.
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/media/ui/coin.png"
      alt={alt}
      aria-hidden={alt === "" ? true : undefined}
      draggable={false}
      className={cn("inline-block shrink-0 object-contain", className)}
    />
  );
}
