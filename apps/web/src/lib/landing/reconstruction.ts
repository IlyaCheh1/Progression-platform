export type ReconstructionTrack = {
  id: string;
  title: string;
  description: string;
  mock: true;
};

/** Placeholder reconstruction tracks — copy will be replaced from the design brief. */
export const RECONSTRUCTION_TRACKS: ReconstructionTrack[] = [
  {
    id: "mock-recon-shield",
    title: "Щит и меч",
    description: "Заглушка. Парные комплексы щита и клинка — уточним после ТЗ.",
    mock: true,
  },
  {
    id: "mock-recon-pole",
    title: "Древковое",
    description: "Заглушка. Древковое оружие в реконструкции — описание появится позже.",
    mock: true,
  },
  {
    id: "mock-recon-formation",
    title: "Построения",
    description: "Заглушка. Массовые построения и полевая дисциплина.",
    mock: true,
  },
  {
    id: "mock-recon-kit",
    title: "Быт и костюм",
    description: "Заглушка. Костюм, быт и материальная культура лагеря.",
    mock: true,
  },
];
