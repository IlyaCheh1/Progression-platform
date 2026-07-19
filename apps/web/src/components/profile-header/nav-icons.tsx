import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement>;

function base(props: IconProps) {
  return {
    viewBox: "0 0 32 32",
    fill: "currentColor",
    "aria-hidden": true as const,
    ...props,
  };
}

/** ПРОФИЛЬ — бюст персонажа */
export function IconProfile(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M16 4c-2.7 0-4.8 2.1-4.8 4.8v1.3c0 2.7 2.1 4.8 4.8 4.8s4.8-2.1 4.8-4.8V8.8C20.8 6.1 18.7 4 16 4Z" />
      <path d="M7 26.6c.9-5.2 4.5-8.4 9-8.4s8.1 3.2 9 8.4c.1.8-.5 1.4-1.3 1.4H8.3c-.8 0-1.4-.6-1.3-1.4Z" />
    </svg>
  );
}

/** ИНВЕНТАРЬ — сундук со слотом замка */
export function IconInventory(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M10 11.5V9.2A4 4 0 0 1 14 5.2h4A4 4 0 0 1 22 9.2v2.3h-1.8V9.2a2.2 2.2 0 0 0-2.2-2.2h-4A2.2 2.2 0 0 0 11.8 9.2v2.3H10Z" />
      <path d="M6.5 12.2h19a1.6 1.6 0 0 1 1.6 1.6v11a2 2 0 0 1-2 2h-18a2 2 0 0 1-2-2v-11a1.6 1.6 0 0 1 1.4-1.6Zm8.7 3.5v7h1.6v-7h-1.6Z" />
    </svg>
  );
}

/** АЧИВКИ — кубок */
export function IconAchievements(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M9.5 5h13v1.7h-1.2c1 1.5 1.5 3.2 1.5 5.1 0 3.9-2.6 6.8-6.3 7.5v2h3.4v1.7H12.1v-1.7h3.4v-2c-3.7-.7-6.3-3.6-6.3-7.5 0-1.9.5-3.6 1.5-5.1H9.5V5Zm3.5 1.7c-.9 1.2-1.4 2.7-1.4 4.4 0 2.9 1.9 5.1 4.4 5.1s4.4-2.2 4.4-5.1c0-1.7-.5-3.2-1.4-4.4h-6Z" />
      <path d="M6.2 7.2h2.8v2.6c0 1.4-.8 2.6-2 3.1l-.9-1.5c.5-.2.8-.8.8-1.3V8.7H6.2V7.2Zm16.8 0h2.8v1.5h-.7v1.4c0 .5.3 1.1.8 1.3l-.9 1.5c-1.2-.5-2-1.7-2-3.1V7.2Z" />
      <path d="M11.2 26h9.6v1.7h-9.6V26Z" />
    </svg>
  );
}

/** ТАЛАНТЫ — дерево навыков */
export function IconTalents(props: IconProps) {
  return (
    <svg {...base(props)}>
      <circle cx="16" cy="6.2" r="2.4" />
      <circle cx="8.2" cy="14.2" r="2.4" />
      <circle cx="23.8" cy="14.2" r="2.4" />
      <circle cx="16" cy="22.2" r="2.4" />
      <circle cx="8.2" cy="27.2" r="2.1" />
      <circle cx="23.8" cy="27.2" r="2.1" />
      <path d="M15.2 8.4h1.6v3.2h-1.6V8.4Zm-5.4 4.2 4.7-3.8 1.1 1.3-4.7 3.8-1.1-1.3Zm12.5-2.5 1.1 1.3-4.7 3.8-1.1-1.3 4.7-3.8ZM15.2 16.4h1.6v3.6h-1.6v-3.6Zm-5.4 6.4 4.7-4 1.1 1.3-4.7 4-1.1-1.3Zm12.5-2.7 1.1 1.3-4.7 4-1.1-1.3 4.7-4Z" />
    </svg>
  );
}

/** ЛАВКА — ларёк с витриной */
export function IconStore(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M4.5 11.2 7.4 5.5h17.2l2.9 5.7H4.5Z" />
      <path
        fillRule="evenodd"
        d="M6.2 12.8h19.6V25a1.8 1.8 0 0 1-1.8 1.8H8a1.8 1.8 0 0 1-1.8-1.8V12.8Zm3.8 2.4h3v8H10v-8Zm4.6 0h3v8h-3v-8Zm4.6 0h3v8h-3v-8Z"
      />
    </svg>
  );
}

/** ШКОЛЫ — щит с клинком */
export function IconSchools(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M16 3.2 6.5 6.4v7.3c0 5.9 4 11 9.5 12.9 5.5-1.9 9.5-7 9.5-12.9V6.4L16 3.2Zm0 2.4 7.5 2.6v5.5c0 4.4-2.9 8.3-7.5 10-4.6-1.7-7.5-5.6-7.5-10V8.2L16 5.6Z" />
      <path d="M15.2 10.5h1.6v9.2h-1.6v-9.2Z" />
      <path d="M12.4 18.2h7.2v1.6h-7.2v-1.6Z" />
    </svg>
  );
}

export function IconDirectionDown(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M5.012 9C4.112 9 3.661 10.077 4.298 10.706L7.427 13.802C9.583 15.934 10.661 17 12 17s2.417-1.066 4.573-3.198L19.702 10.706C20.339 10.077 19.888 9 18.988 9c-.268 0-.525.105-.714.293L15.144 12.388c-1.118 1.106-1.816 1.79-2.389 2.223-.517.39-.698.39-.752.39H12l-.003-.001c-.054 0-.235 0-.752-.39-.573-.433-1.271-1.117-2.389-2.223L5.727 9.293C5.537 9.105 5.28 9 5.012 9Z" />
    </svg>
  );
}
