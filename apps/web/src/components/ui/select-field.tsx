"use client";

import { cn } from "@/lib/utils";

export type SelectOption = { value: string; label: string };

type SelectFieldProps = {
  options: SelectOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
};

export default function SelectField({
  options,
  value,
  onChange,
  placeholder,
  className,
  disabled,
}: SelectFieldProps) {
  return (
    <select
      value={value}
      disabled={disabled}
      onChange={(event) => onChange(event.target.value)}
      className={cn(
        "h-11 w-full appearance-none rounded-2xl border border-mos-line/40 bg-mos-bg/60 px-3 text-sm text-mos-text outline-none backdrop-blur-sm focus:border-mos-amber disabled:opacity-60",
        className,
      )}
    >
      {placeholder ? (
        <option value="" disabled>
          {placeholder}
        </option>
      ) : null}
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
}
