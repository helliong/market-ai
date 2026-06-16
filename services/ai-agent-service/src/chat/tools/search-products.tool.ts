import type { GigaChatFunction } from '../chat.types';

export const SEARCH_PRODUCTS_TOOL: GigaChatFunction = {
  name: 'searchProducts',
  description:
    'Ищет реальные товары в каталоге MarketAI. Используй, когда пользователь хочет найти, купить, подобрать или посмотреть товары.',
  parameters: {
    type: 'object',
    properties: {
      query: {
        type: 'string',
        description: 'Короткий поисковый запрос с названием или типом товара',
      },
      maxPrice: {
        type: 'number',
        description: 'Максимальная цена в рублях',
      },
      category: {
        type: 'string',
        description: 'Категория или подкатегория товара',
      },
    },
    required: ['query'],
  },
};
