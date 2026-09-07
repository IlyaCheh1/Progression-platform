import { LANDING_TRAINERS } from "../landing-trainers.ts";

import { cardImageAlt } from "./copy.ts";
import type { CardSymbol, SideId, TeamCard } from "./types.ts";

const TRAINER_SYMBOLS: Record<string, { symbol: CardSymbol; badge: string }> = {
  "max-kiselev": { symbol: "star", badge: "Автор школы" },
  "nikolay-lobanov": { symbol: "triangle", badge: "Рапира" },
  "tatyana-gribanova": { symbol: "hexagon", badge: "Ушу" },
  "ivan-bobrovsky": { symbol: "rhombus", badge: "Иберия" },
};

type MockSpec = {
  id: string;
  side: SideId;
  name: string;
  symbol: CardSymbol;
  accent: string;
  initials: string;
};

function initialsOf(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

function trainerCards(): TeamCard[] {
  return LANDING_TRAINERS.map((trainer) => {
    const meta = TRAINER_SYMBOLS[trainer.id] ?? { symbol: "rhombus" as const, badge: "Мастер" };
    return {
      id: trainer.id,
      side: "sideA" as const,
      name: trainer.name,
      role: trainer.role,
      shortDescription: trainer.bio[0] ?? trainer.role,
      fullDescription: trainer.bio.join("\n\n"),
      skills: [trainer.role],
      badge: meta.badge,
      mock: false,
      initials: initialsOf(trainer.name),
      image: { src: trainer.photo, alt: cardImageAlt(trainer.name, trainer.role) },
      visual: { accent: trainer.accent, symbol: meta.symbol },
    };
  });
}

function mockCard(spec: MockSpec): TeamCard {
  return {
    id: spec.id,
    side: spec.side,
    name: spec.name,
    role: "Место в составе",
    shortDescription: "Карта-заглушка. Данные появятся позже.",
    fullDescription:
      "Это не сотрудник школы и не выдуманная биография. Слот оставлен пустым, чтобы доска оставалась 6×6, пока появятся реальные данные.",
    badge: "Заглушка",
    mock: true,
    initials: spec.initials,
    image: { alt: cardImageAlt(spec.name, "заглушка") },
    visual: { accent: spec.accent, symbol: spec.symbol },
  };
}

/** Two school vacancies keep side A at six cards without inventing staff. */
const SCHOOL_MOCKS: MockSpec[] = [
  { id: "mock-school-vacancy-1", side: "sideA", name: "Вакансия I", symbol: "cross", accent: "#8a7048", initials: "I" },
  { id: "mock-school-vacancy-2", side: "sideA", name: "Вакансия II", symbol: "hexagon", accent: "#6e5a3a", initials: "II" },
];

/** Sparring side is entirely placeholders. */
const SPARRING_MOCKS: MockSpec[] = [
  { id: "mock-sparring-1", side: "sideB", name: "Спарринг I", symbol: "star", accent: "#7a6a4a", initials: "С1" },
  { id: "mock-sparring-2", side: "sideB", name: "Спарринг II", symbol: "triangle", accent: "#9a5a3a", initials: "С2" },
  { id: "mock-sparring-3", side: "sideB", name: "Спарринг III", symbol: "hexagon", accent: "#4a7a68", initials: "С3" },
  { id: "mock-sparring-4", side: "sideB", name: "Спарринг IV", symbol: "rhombus", accent: "#4a6880", initials: "С4" },
  { id: "mock-sparring-5", side: "sideB", name: "Спарринг V", symbol: "cross", accent: "#8a4a5a", initials: "С5" },
  { id: "mock-sparring-6", side: "sideB", name: "Спарринг VI", symbol: "cross", accent: "#5a5a72", initials: "С6" },
];

export const TEAM_BOARD_CARDS: TeamCard[] = [
  ...trainerCards(),
  ...SCHOOL_MOCKS.map(mockCard),
  ...SPARRING_MOCKS.map(mockCard),
];

export function buildRows() {
  return (["sideA", "sideB"] as const).flatMap((side) =>
    (["row-1", "row-2", "row-3"] as const).map((key) => ({
      id: `${side}-${key}`,
      side,
      key,
    })),
  );
}
