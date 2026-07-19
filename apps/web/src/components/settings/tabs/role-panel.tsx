import Link from "next/link";
import type { ReactNode } from "react";

export default function RolePanel({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="space-y-3">
      <h2 className="font-display text-sm font-medium text-mos-text md:text-[17px]">{title}</h2>
      <div className="space-y-3 text-sm leading-relaxed text-mos-muted">{children}</div>
    </div>
  );
}

export function RoleLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link href={href} className="og-btn og-btn-primary og-btn-md mt-2 inline-flex uppercase">
      {children}
    </Link>
  );
}
