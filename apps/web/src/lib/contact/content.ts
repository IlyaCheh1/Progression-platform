import { LEGAL_ENTITY } from "@/lib/legal/content";

export type ContactField = {
  key: string;
  label: string;
  value: string;
  href?: string;
  external?: boolean;
};

export const CONTACT_CONTENT = {
  title: "Контакты",
  sectionHeading: "Информация об исполнителе",
  items: [
    {
      key: "name",
      label: "Исполнитель",
      value: LEGAL_ENTITY.name,
    },
    {
      key: "brand",
      label: "Бренд",
      value: LEGAL_ENTITY.brand,
    },
    {
      key: "region",
      label: "Регион ведения деятельности",
      value: LEGAL_ENTITY.region,
    },
    {
      key: "activity",
      label: "Основной вид деятельности",
      value: LEGAL_ENTITY.activity,
    },
    {
      key: "inn",
      label: "ИНН",
      value: LEGAL_ENTITY.inn,
    },
    {
      key: "ogrnip",
      label: "ОГРНИП",
      value: LEGAL_ENTITY.ogrnip,
    },
    {
      key: "vk",
      label: "Сообщество ВКонтакте",
      value: LEGAL_ENTITY.vkUrl.replace("https://", ""),
      href: LEGAL_ENTITY.vkUrl,
      external: true,
    },
    {
      key: "site",
      label: "Сайт и запись на занятия",
      value: LEGAL_ENTITY.siteName,
      href: "/login",
    },
  ] satisfies ContactField[],
} as const;
