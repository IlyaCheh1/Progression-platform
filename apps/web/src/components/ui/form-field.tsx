import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type FormFieldProps = {
  label?: string;
  htmlFor?: string;
  error?: string;
  className?: string;
  children: ReactNode;
};

export default function FormField({ label, htmlFor, error, className, children }: FormFieldProps) {
  return (
    <div className={cn("flex flex-col gap-1", className)}>
      {label ? (
        <label htmlFor={htmlFor} className="text-sm text-mos-muted">
          {label}
        </label>
      ) : null}
      {children}
      {error ? <p className="text-xs text-mos-danger">{error}</p> : null}
    </div>
  );
}
