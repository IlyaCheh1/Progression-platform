import type { CSSProperties } from "react";

function parseHex(hex: string) {
  const normalized = hex.replace("#", "");
  return {
    r: parseInt(normalized.slice(0, 2), 16),
    g: parseInt(normalized.slice(2, 4), 16),
    b: parseInt(normalized.slice(4, 6), 16),
  };
}

function rgbToHex(r: number, g: number, b: number) {
  return `#${[r, g, b].map((value) => value.toString(16).padStart(2, "0")).join("")}`;
}

function mixRgb(color: [number, number, number], target: [number, number, number], amount: number) {
  return color.map((channel, index) =>
    Math.round(channel + (target[index] - channel) * amount),
  ) as [number, number, number];
}

function relativeLuminance(r: number, g: number, b: number) {
  const channels = [r, g, b].map((value) => {
    const channel = value / 255;
    return channel <= 0.03928 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
  });

  return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];
}

/** Filled button theme derived from a service/school accent color (OG landing pattern). */
export function buildServiceButtonTheme(hex: string): CSSProperties {
  const { r, g, b } = parseHex(hex);
  const base: [number, number, number] = [r, g, b];
  const top = rgbToHex(...mixRgb(base, [255, 255, 255], 0.34));
  const lower = rgbToHex(...mixRgb(base, [0, 0, 0], 0.22));
  const bottom = rgbToHex(...mixRgb(base, [0, 0, 0], 0.42));
  const insetShadow =
    "inset 0 1px 0 rgba(255, 255, 255, 0.35), inset 0 -2px 0 rgba(0, 0, 0, 0.18)";

  return {
    ["--og-btn-text" as string]: relativeLuminance(r, g, b) > 0.62 ? "var(--mos-bg)" : "#ffffff",
    ["--og-btn-gradient" as string]: `linear-gradient(180deg, ${top} 0%, ${hex} 42%, ${lower} 78%, ${bottom} 100%)`,
    ["--og-btn-shadow" as string]: insetShadow,
    ["--og-btn-shadow-hover" as string]: insetShadow,
  };
}
