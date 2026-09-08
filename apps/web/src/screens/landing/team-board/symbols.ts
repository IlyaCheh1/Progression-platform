import type { CardSymbol, SymbolDef, TeamCard } from "./types.ts";

export const SYMBOL_DEFS: Record<CardSymbol, SymbolDef> = {
  star: { symbol: "star", basePower: 5, allowedRowKeys: ["row-1", "row-2", "row-3"] },
  triangle: { symbol: "triangle", basePower: 6, allowedRowKeys: ["row-1", "row-2"] },
  hexagon: { symbol: "hexagon", basePower: 5, allowedRowKeys: ["row-1", "row-2"] },
  rhombus: { symbol: "rhombus", basePower: 3, allowedRowKeys: ["row-2", "row-3"] },
  cross: { symbol: "cross", basePower: 4, allowedRowKeys: ["row-1", "row-3"] },
};

export const SYMBOL_PATHS: Record<CardSymbol, string> = {
  rhombus: "M12 1.5 22.5 12 12 22.5 1.5 12Z",
  triangle: "M12 2.5 22 20.5H2Z",
  hexagon: "M12 1.75 21 7v10l-9 5.25L3 17V7Z",
  star: "M12 1.75 15 8.4l7.2.8-5.4 4.9 1.5 7.15L12 17.6l-6.3 3.65 1.5-7.15L1.8 9.2 9 8.4Z",
  cross: "M9.6 1.75h4.8V9.6h7.85v4.8H14.4v7.85H9.6V14.4H1.75V9.6H9.6Z",
};

export const ROW_SIGILS = ["melee", "ranged", "siege"] as const;

export const LANE_PATHS: Record<(typeof ROW_SIGILS)[number], string> = {
  melee:
    "M12 2.1c.32 0 .58.16.7.46l.32 1.05 1.62 1.48v1.22l-1.5.4v7.35l2.55 2.35v1.55H8.31v-1.55l2.55-2.35V5.71l-1.5-.4V4.09l1.62-1.48.32-1.05C11.42 2.26 11.68 2.1 12 2.1zM8.2 15.05h7.6v1.35H8.2z",
  ranged:
    "M5 4.35c.45-.4 1.05-.22 1.32.32 2.05 2.55 3.18 4.85 3.18 7.33s-1.13 4.78-3.18 7.33c-.27.54-.87.72-1.32.32-.4-.38-.32-.98.16-1.32 1.85-1.72 3.05-3.85 3.05-6.33s-1.2-4.61-3.05-6.33c-.48-.34-.56-.94-.16-1.32zM9.05 11.2h10.2v1.55H9.05zM17.15 8.05 18.3 6.9l3.45 3.45-1.2 1.1zM17.15 15.95l1.15 1.15 3.45-3.45-1.2-1.1z",
  siege:
    "M4.4 17.05h15.2v1.7H4.4zM7.15 15.85 12 7.7l4.85 8.15H7.15zM12 6.55a1.45 1.45 0 1 0 0-2.9 1.45 1.45 0 0 0 0 2.9zM12.35 7.85l4.55-2.5.85 1.45-4.55 2.5z",
};

export const ICON_PATHS = { ...SYMBOL_PATHS, ...LANE_PATHS };

export function cardSymbol(card: TeamCard): CardSymbol {
  const symbol = card.visual?.symbol;
  return symbol && symbol in SYMBOL_DEFS ? symbol : "rhombus";
}

export function basePowerOf(card: TeamCard): number {
  return SYMBOL_DEFS[cardSymbol(card)].basePower;
}

export function allowedRowsFor(card: TeamCard): string[] {
  return SYMBOL_DEFS[cardSymbol(card)].allowedRowKeys.map((key) => `${card.side}-${key}`);
}
