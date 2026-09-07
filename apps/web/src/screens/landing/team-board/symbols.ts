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

export const ROW_SIGILS = ["triangle", "hexagon", "rhombus"] as const;

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
