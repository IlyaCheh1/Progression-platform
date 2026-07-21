import Image from "next/image";
import { cn } from "@/lib/utils";

type PageBackgroundProps = {
  src: string;
  className?: string;
  imageClassName?: string;
  priority?: boolean;
  objectPosition?: string;
  sizes?: string;
};

/** Full-bleed optimized page/stage background via next/image. */
export default function PageBackground({
  src,
  className,
  imageClassName,
  priority = true,
  objectPosition,
  sizes = "100vw",
}: PageBackgroundProps) {
  return (
    <div aria-hidden className={cn("pointer-events-none absolute inset-0 overflow-hidden", className)}>
      <Image
        src={src}
        alt=""
        fill
        priority={priority}
        sizes={sizes}
        className={cn("object-cover", imageClassName)}
        style={objectPosition ? { objectPosition } : undefined}
        draggable={false}
      />
    </div>
  );
}
