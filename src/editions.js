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

const firstSegment = window.location.pathname.split("/")[1];
export const editionId = Object.hasOwn(editions, firstSegment) ? firstSegment : "studio";
export const edition = editions[editionId];
export const editionBase = Object.hasOwn(editions, firstSegment) ? `/${firstSegment}` : "/";
