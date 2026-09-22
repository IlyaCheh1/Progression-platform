/** Public school address. Keyless Yandex map widget — the repo has no Maps API key. */

export const SCHOOL_ADDRESS = "Москва, Госпитальный вал 5к18";

export const SCHOOL_ADDRESS_ROUTE =
  "10 минут от станции метро Электрозаводская, рядом со стадионом Металлург МГТУ им. Баумана";

export const SCHOOL_ENTRANCE_LABEL = "Вход в школу:";

export const SCHOOL_ENTRANCE = "справа от 5-го подъезда, со двора дома";

/** Published point for Госпитальный вал, 5к18. */
export const SCHOOL_ADDRESS_POINT = {
  lon: 37.704987,
  lat: 55.774781,
} as const;

function pointQuery(): string {
  return `${SCHOOL_ADDRESS_POINT.lon},${SCHOOL_ADDRESS_POINT.lat}`;
}

export function schoolAddressMapSrc(): string {
  const point = pointQuery();
  return `https://yandex.ru/map-widget/v1/?ll=${point}&z=16&pt=${point},pm2rdm&l=map&theme=dark`;
}
