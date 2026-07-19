import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement>;

function base(props: IconProps) {
  return { viewBox: "0 0 24 24", fill: "currentColor", "aria-hidden": true as const, ...props };
}

export function IconOverview(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M3 3h8v8H3V3Zm10 0h8v5h-8V3ZM3 13h5v8H3v-8Zm7 3h11v5H10v-5Zm0-3h11v2H10v-2Z" />
    </svg>
  );
}

export function IconQuest(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M7 2h10v2H7V2Zm-2 4h14l1 14H4L5 6Zm4 3v2h6V9H9Zm0 4v2h6v-2H9Z" />
    </svg>
  );
}

export function IconTrophy(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M6 3h12v2h2a2 2 0 0 1 2 2v1a5 5 0 0 1-4.3 4.9A5 5 0 0 1 13 16.9V18h3v2H8v-2h3v-1.1A5 5 0 0 1 6.3 12.9 5 5 0 0 1 2 8V7a2 2 0 0 1 2-2h2V3Zm0 4H4v1a3 3 0 0 0 3 3V7H6Zm12 0h-3v4a3 3 0 0 0 3-3V7Z" />
    </svg>
  );
}

export function IconTalent(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M12 2 14.5 9H22l-6 4.5L18.5 21 12 16.5 5.5 21 8 13.5 2 9h7.5L12 2Z" />
    </svg>
  );
}

export function IconSchool(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M12 3 2 8l10 5 8-4v7h2V8L12 3Zm-6 9.2V16c0 1.7 2.7 3 6 3s6-1.3 6-3v-3.8l-6 3-6-3Z" />
    </svg>
  );
}
