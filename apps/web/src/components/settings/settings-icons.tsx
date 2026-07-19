import type { ReactNode, SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement>;

function base(props: IconProps) {
  return { viewBox: "0 0 24 24", fill: "currentColor", "aria-hidden": true as const, ...props };
}

export function IconUser(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M12 12a4.5 4.5 0 1 0-4.5-4.5A4.5 4.5 0 0 0 12 12Zm0 2c-4.2 0-7.5 2.3-7.5 5v1h15v-1c0-2.7-3.3-5-7.5-5Z" />
    </svg>
  );
}

export function IconShield(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M12 2 4 5v6c0 5 3.4 9.4 8 11 4.6-1.6 8-6 8-11V5l-8-3Zm0 2.2 6 2.2v4.6c0 3.8-2.5 7.3-6 8.7-3.5-1.4-6-4.9-6-8.7V6.4l6-2.2Z" />
    </svg>
  );
}

export function IconEyeSlash(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="m3.3 2.2 18.5 18.5-1.4 1.4-3.2-3.2A10.8 10.8 0 0 1 12 20C6.5 20 2.2 16.1 1 12c.5-1.6 1.4-3.1 2.6-4.3L1.9 3.6 3.3 2.2ZM12 6c5.5 0 9.8 3.9 11 8-.4 1.3-1.1 2.5-2 3.5l-2.3-2.3A4.9 4.9 0 0 0 12 7.1V6Zm0 3.1a3 3 0 0 1 3 3c0 .4-.1.8-.2 1.1l-3.9-3.9c.3-.1.7-.2 1.1-.2Z" />
    </svg>
  );
}

export function IconBell(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M12 22a2.5 2.5 0 0 0 2.45-2h-4.9A2.5 2.5 0 0 0 12 22Zm7-6V11a7 7 0 0 0-5-6.7V3.5a2 2 0 1 0-4 0v.8A7 7 0 0 0 5 11v5l-2 2v1h18v-1l-2-2Z" />
    </svg>
  );
}

export function IconCoach(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M4 6h16v2H4V6Zm2 4h12l-1 10H7L6 10Zm5 2v6h2v-6h-2Z" />
    </svg>
  );
}

export function IconPeople(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M9 12a3.5 3.5 0 1 0-3.5-3.5A3.5 3.5 0 0 0 9 12Zm6 0a3 3 0 1 0-3-3 3 3 0 0 0 3 3ZM9 14c-3.3 0-6 1.8-6 4v1h12v-1c0-2.2-2.7-4-6-4Zm6 .5c-.3 0-.7 0-1 .1 1.5.9 2.5 2.2 2.5 3.9V19h5v-1c0-1.9-2.2-3.5-4.5-3.5Z" />
    </svg>
  );
}

export function IconKey(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M14 3a6 6 0 0 0-5.7 8L2 17.3V21h3.7l1.3-1.3V17h2.5l2.5-2.5A6 6 0 1 0 14 3Zm0 2a4 4 0 1 1 0 8 4 4 0 0 1 0-8Zm1 2h-2v2h2V7Z" />
    </svg>
  );
}

export function IconPalette(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M12 2a10 10 0 0 0-1 19.95V19a2 2 0 0 1 2-2h.5a2.5 2.5 0 0 0 0-5H13a1 1 0 0 1 0-2h3.5A3.5 3.5 0 0 0 20 6.5 8.5 8.5 0 0 0 12 2Zm-5 9.5A1.5 1.5 0 1 1 8.5 10 1.5 1.5 0 0 1 7 11.5Zm3-4A1.5 1.5 0 1 1 11.5 6 1.5 1.5 0 0 1 10 7.5Zm4 0A1.5 1.5 0 1 1 15.5 6 1.5 1.5 0 0 1 14 7.5Zm3 4A1.5 1.5 0 1 1 18.5 10 1.5 1.5 0 0 1 17 11.5Z" />
    </svg>
  );
}

export const SETTINGS_TAB_ICONS: Record<string, (props: IconProps) => ReactNode> = {
  personal: (p) => <IconUser {...p} />,
  customization: (p) => <IconPalette {...p} />,
  security: (p) => <IconShield {...p} />,
  privacy: (p) => <IconEyeSlash {...p} />,
  notifications: (p) => <IconBell {...p} />,
  admin: (p) => <IconShield {...p} />,
  coach: (p) => <IconCoach {...p} />,
  guardian: (p) => <IconPeople {...p} />,
  renter: (p) => <IconKey {...p} />,
};
