export const productCategoriesTree: Record<string, string[]> = {
  'Электроника': [
    'Смартфоны',
    'Аксессуары для смартфонов и телефонов',
    'Смарт-часы',
    'Фитнес-браслеты',
    'Ремешки для смарт-часов',
    'Защитные стекла',
    'Наушники',
    'Беспроводные колонки',
    'Умные колонки',
    'Микрофоны',
    'Студийное оборудование',
    'Акустические системы',
    'Аксессуары',
    'Выключатели и реле',
    'Датчики и регуляторы',
    'Комплекты умного дома',
    'Освещение',
    'Розетки',
    'Ноутбуки',
    'Игровые ноутбуки',
    'Планшеты',
    'Электронные книги',
    'Графические планшеты',
    'Чехлы и подставки',
    'Мониторы',
    'Системные блоки',
    'Моноблоки',
    'Клавиатуры',
    'Мыши',
    'Сетевое оборудование',
    'Телевизоры',
    'ТВ-приставки',
    'Кронштейны и крепления',
    'Онлайн-кинотеатры',
    'Пульты ДУ',
    'Экшн-камеры',
    'Видеокамеры',
    'Зеркальные фотоаппараты',
    'Объективы',
    'Компактные фотоаппараты',
    'Кабели и переходники',
    'Внешние аккумуляторы',
    'Батарейки',
    'Зарядные устройства',
    'Чехлы',
  ],
  'Одежда': [
    'Футболки',
    'Шорты',
    'Юбки',
    'Брюки',
    'Платья',
    'Верхняя одежда',
  ],
  'Обувь': [
    'Кроссовки',
    'Ботинки',
    'Туфли',
    'Сапоги',
  ],
  'Спорт': [
    'Спортивная одежда',
    'Спортивная обувь',
    'Инвентарь',
    'Тренажеры',
  ],
  'Дом и быт': [
    'Посуда',
    'Текстиль',
    'Декор',
    'Хозяйственные товары',
  ],
  'Красота и здоровье': [
    'Уход за кожей',
    'Уход за волосами',
    'Макияж',
    'Парфюмерия',
  ],
};

export const productMainCategories = Object.keys(productCategoriesTree) as readonly string[];

const legacyProductCategories = [
  'Аудиотехника',
  'Компьютеры и периферия',
  'Умный дом',
  'ТВ и видеотехника',
] as const;

export const productCategories = [
  ...Object.values(productCategoriesTree).flat(),
  ...productMainCategories,
  ...legacyProductCategories,
] as readonly string[];

export function isProductCategory(category: string): boolean {
  return productCategories.includes(
    category.trim() as (typeof productCategories)[number],
  );
}

export function getMainCategoryBySubcategory(subcategory: string): string {
  const normalizedSubcategory = subcategory.trim();

  if (productMainCategories.includes(normalizedSubcategory)) {
    return normalizedSubcategory;
  }

  for (const [mainCat, subCats] of Object.entries(productCategoriesTree)) {
    if (subCats.includes(normalizedSubcategory)) {
      return mainCat;
    }
  }

  if (
    legacyProductCategories.includes(
      normalizedSubcategory as (typeof legacyProductCategories)[number],
    )
  ) {
    return 'Электроника';
  }

  return productMainCategories[0]; // fallback
}
