import type { SVGProps } from "react";
import { cn } from "@/lib/utils";

type IconProps = SVGProps<SVGSVGElement>;

function base(props: IconProps) {
  return {
    viewBox: "0 0 32 32",
    fill: "currentColor",
    "aria-hidden": true as const,
    ...props,
  };
}

/** Higgs-generated nav icons (transparent WebP). */
export const NAV_ICON_SRC = {
  home: "/media/nav-icons/profile.webp",
  inventory: "/media/nav-icons/inventory.webp",
  achievements: "/media/nav-icons/achievements.webp",
  talents: "/media/nav-icons/talents.webp",
  store: "/media/nav-icons/store.webp",
  schools: "/media/nav-icons/schools.webp",
} as const;

export function NavRasterIcon({
  src,
  className,
}: {
  src: string;
  className?: string;
}) {
  return (
    // Decorative; tab label provides the accessible name.
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt=""
      aria-hidden
      draggable={false}
      className={cn("h-6 w-6 object-contain xl:h-7 xl:w-7", className)}
    />
  );
}

export function IconDirectionDown(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M5.012 9C4.112 9 3.661 10.077 4.298 10.706L7.427 13.802C9.583 15.934 10.661 17 12 17s2.417-1.066 4.573-3.198L19.702 10.706C20.339 10.077 19.888 9 18.988 9c-.268 0-.525.105-.714.293L15.144 12.388c-1.118 1.106-1.816 1.79-2.389 2.223-.517.39-.698.39-.752.39H12l-.003-.001c-.054 0-.235 0-.752-.39-.573-.433-1.271-1.117-2.389-2.223L5.727 9.293C5.537 9.105 5.28 9 5.012 9Z" />
    </svg>
  );
}
