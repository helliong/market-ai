const catalogSlugByTitle: Record<string, string> = {
  "Смартфоны": "smartphones",
  "Аксессуары для смартфонов и телефонов": "phone-accessories",
  "Смарт-часы": "smart-watches",
  "Фитнес-браслеты": "fitness-trackers",
  "Ремешки для смарт-часов": "watch-straps",
  "Защитные стекла": "screen-protectors",
  "Ноутбуки": "laptops",
  "Игровые ноутбуки": "gaming-laptops",
  "Планшеты": "tablets",
  "Электронные книги": "ebooks",
  "Графические планшеты": "graphic-tablets",
  "Чехлы и подставки": "tablet-cases",
  "Наушники": "headphones",
  "Беспроводные колонки": "wireless-speakers",
  "Умные колонки": "smart-speakers",
  "Микрофоны": "microphones",
  "Мониторы": "monitors",
  "Клавиатуры": "keyboards",
  "Мыши": "mice",
  "Умный дом": "smart-home",
  "Телевизоры": "tvs",
  "Внешние аккумуляторы": "power-banks",
  "Зарядные устройства": "chargers",
};

const catalogTitleBySlug = Object.fromEntries(
  Object.entries(catalogSlugByTitle).map(([title, slug]) => [slug, title]),
) as Record<string, string>;

const catalogSearchQueryByTitle: Record<string, string> = {
  "Смартфоны": "смартфон",
  "Смарт-часы": "смарт-часы",
  "Фитнес-браслеты": "фитнес-браслет",
  "Ноутбуки": "ноутбук",
  "Игровые ноутбуки": "ноутбук",
  "Планшеты": "планшет",
  "Электронные книги": "электронная книга",
  "Наушники": "наушники",
  "Беспроводные колонки": "колонка",
  "Умные колонки": "колонка",
  "Микрофоны": "микрофон",
  "Мониторы": "монитор",
  "Клавиатуры": "клавиатура",
  "Мыши": "мышь",
  "Внешние аккумуляторы": "аккумулятор",
  "Зарядные устройства": "заряд",
};

export function getCatalogSlug(title: string) {
  return (
    catalogSlugByTitle[title] ??
    encodeURIComponent(title.trim().toLowerCase().replace(/\s+/g, "-"))
  );
}

export function getCatalogTitleFromSlug(slug: string) {
  return catalogTitleBySlug[slug] ?? decodeURIComponent(slug).replace(/-/g, " ");
}

export function getCatalogSearchQuery(title: string) {
  return catalogSearchQueryByTitle[title] ?? title;
}
