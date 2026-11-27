export const editions = {
  studio: {
    name: "Studio",
    title: "Техника в деталях",
    description: "Рассмотрите материалы и форму. Сравните характеристики и выберите устройство.",
    featured: "prism-x1",
    model: "phone",
    product: "Prism X1",
    category: "Смартфоны",
  },
  orbit: {
    name: "Orbit",
    title: "Сосредоточьтесь на звуке",
    description: "Беспроводные Echo Neon с активным шумоподавлением и автономностью до 44 часов.",
    featured: "echo-neon",
    model: "audio",
    product: "Echo Neon",
    category: "Наушники",
  },
  signal: {
    name: "Signal",
    title: "Техника для работы и творчества",
    description: "Orbit 14 с OLED-экраном и 32 ГБ памяти. В каталоге также есть смартфоны и наушники.",
    featured: "orbit-14",
    model: "laptop",
    product: "Orbit 14",
    category: "Ноутбуки",
  },
};

export const siteBase = import.meta.env?.BASE_URL ?? "/";
const pathname = globalThis.location?.pathname ?? siteBase;
const firstSegment = pathname.slice(siteBase.length).split("/")[0];
const hasEditionPrefix = Object.hasOwn(editions, firstSegment);
export const editionId = hasEditionPrefix ? firstSegment : "studio";
export const edition = editions[editionId];
export const editionBase = hasEditionPrefix ? `${siteBase}${firstSegment}` : siteBase;
