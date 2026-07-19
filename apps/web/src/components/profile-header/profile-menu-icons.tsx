import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement>;

function base(props: IconProps) {
  return { viewBox: "0 0 24 24", fill: "currentColor", "aria-hidden": true as const, ...props };
}

export function IconProfileSettings(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M12 15.5A3.5 3.5 0 1 0 12 8.5a3.5 3.5 0 0 0 0 7Zm8.9-2.8a7.8 7.8 0 0 0-.2-1.2l1.9-1.5-1.8-3.1-2.2.9a7.9 7.9 0 0 0-1-.6L17 4h-3.6l-.4 2.2a7.9 7.9 0 0 0-1 .6l-2.2-.9-1.8 3.1 1.9 1.5c-.1.4-.1.8-.2 1.2l-2.5.4v3.6l2.5.4c.1.4.1.8.2 1.2l-1.9 1.5 1.8 3.1 2.2-.9c.3.2.7.4 1 .6L13.4 20H17l.4-2.2c.3-.2.7-.4 1-.6l2.2.9 1.8-3.1-1.9-1.5c.1-.4.1-.8.2-1.2l2.5-.4v-3.6l-2.5-.4Z" />
    </svg>
  );
}

export function IconProfileCabinet(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M4 5h16v3H4V5Zm0 5h10v9H4v-9Zm12 0h4v9h-4v-9Z" />
    </svg>
  );
}

export function IconProfileLogout(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M10 3h8a1 1 0 0 1 1 1v16a1 1 0 0 1-1 1h-8v-2h7V5h-7V3ZM8.7 8.3 6.4 10.6H15v2H6.4l2.3 2.3-1.4 1.4-4.7-4.7 4.7-4.7 1.4 1.4Z" />
    </svg>
  );
}
