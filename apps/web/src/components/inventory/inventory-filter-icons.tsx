import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement>;

function base(props: IconProps) {
  return { viewBox: "0 0 24 24", fill: "none", "aria-hidden": true as const, ...props };
}

/** OG all.svg */
export function IconInventoryAll(props: IconProps) {
  return (
    <svg {...base(props)}>
      <rect x="2" y="14" width="8" height="8" rx="2" stroke="currentColor" strokeWidth="1.5" />
      <rect x="2" y="2" width="8" height="8" rx="2" stroke="currentColor" strokeWidth="1.5" />
      <rect x="14" y="14" width="8" height="8" rx="2" stroke="currentColor" strokeWidth="1.5" />
      <path
        d="M13.1005 8.07108C12.3195 7.29003 12.3195 6.0237 13.1005 5.24266L15.9289 2.41423C16.71 1.63318 17.9763 1.63318 18.7574 2.41423L21.5858 5.24266C22.3668 6.0237 22.3668 7.29003 21.5858 8.07108L18.7574 10.8995C17.9763 11.6806 16.71 11.6806 15.9289 10.8995L13.1005 8.07108Z"
        stroke="currentColor"
        strokeWidth="1.5"
      />
    </svg>
  );
}

/** OG people.svg */
export function IconInventoryCharacters(props: IconProps) {
  return (
    <svg {...base(props)}>
      <ellipse cx="10" cy="17.5" rx="7" ry="3.5" stroke="currentColor" />
      <circle cx="10" cy="7" r="4" stroke="currentColor" />
      <path
        d="M15.3402 4.26538C17.2517 4.4373 18.7502 6.04349 18.7504 7.99976C18.7504 10.0707 17.0713 11.7495 15.0004 11.7498C14.6088 11.7498 14.2312 11.6892 13.8763 11.5779C14.3281 11.195 14.7212 10.7462 15.0433 10.2468C16.2659 10.2237 17.2504 9.22789 17.2504 7.99976C17.2503 7.07916 16.6966 6.2885 15.9047 5.94019C15.7989 5.34705 15.6066 4.78446 15.3402 4.26538Z"
        fill="currentColor"
      />
      <path
        d="M15.7523 13.2703C17.1923 13.3416 18.5097 13.614 19.5316 14.0399C20.1285 14.2886 20.6608 14.6037 21.0551 14.992C21.452 15.3831 21.7503 15.8935 21.7504 16.4998C21.7504 17.1061 21.4519 17.6166 21.0551 18.0076C20.6608 18.3959 20.1284 18.7111 19.5316 18.9598C19.2142 19.092 18.8675 19.2079 18.4984 19.3094C18.8125 18.7586 18.9877 18.1693 18.9974 17.5545C19.4628 17.356 19.7959 17.1416 20.0023 16.9383C20.2122 16.7314 20.2504 16.5837 20.2504 16.4998C20.2503 16.4159 20.2122 16.2682 20.0023 16.0613C19.7895 15.8517 19.443 15.6282 18.9545 15.4246C18.7072 15.3216 18.4322 15.2276 18.1342 15.1443C17.5698 14.4179 16.7529 13.7791 15.7523 13.2703Z"
        fill="currentColor"
      />
    </svg>
  );
}

/** OG image.svg */
export function IconInventoryBackgrounds(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path
        d="M22 14L19.061 11.8839C17.5338 10.7843 15.4467 10.898 14.0479 12.1569L9.95209 15.8431C8.55331 17.102 6.4662 17.2157 4.93901 16.1161L2 14M6 22H18C20.2091 22 22 20.2091 22 18V6C22 3.79086 20.2091 2 18 2H6C3.79086 2 2 3.79086 2 6V18C2 20.2091 3.79086 22 6 22ZM11 8.5C11 9.88071 9.88071 11 8.5 11C7.11929 11 6 9.88071 6 8.5C6 7.11929 7.11929 6 8.5 6C9.88071 6 11 7.11929 11 8.5Z"
        stroke="currentColor"
        strokeWidth="1.5"
      />
    </svg>
  );
}

/** Sword / equipment filter */
export function IconInventoryEquipment(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path
        d="M14.5 17.5 3 6V3h3l11.5 11.5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M13 19l6-6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M16 16l4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M19 21l2.5-2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}
