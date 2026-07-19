export const routes = {
  home: "/profile",
  inventory: "/inventory",
  achievements: "/achievements",
  talents: "/talents",
  store: "/store",
  settings: "/settings",
  onboarding: "/onboarding",
  login: "/login",
  admin: "/admin",
  coach: "/coach",
  guardian: "/guardian",
  renter: "/renter",
  studio: "/studio",
} as const;

export type ProfileNavItem = {
  id: string;
  label: string;
  href: string;
  inDevelopment?: boolean;
  dropdown?: boolean;
};

/** Верхняя навигация профиля — пункты как у OnlyGames, визуал Witcher. */
export const profileNavItems: ProfileNavItem[] = [
  { id: "home", label: "ПРОФИЛЬ", href: routes.home },
  { id: "inventory", label: "ИНВЕНТАРЬ", href: routes.inventory },
  { id: "achievements", label: "АЧИВКИ", href: routes.achievements },
  { id: "talents", label: "ТАЛАНТЫ", href: routes.talents },
  { id: "store", label: "ЛАВКА", href: routes.store },
  { id: "schools", label: "ШКОЛЫ", href: "/schools", dropdown: true },
];
