import type { GigaChatFunction } from '../chat.types';

export const GET_PRODUCT_DETAILS_TOOL: GigaChatFunction = {
  name: 'getProductDetails',
  description:
    'Получает подробные данные реального товара по ID. Используй для уточнения характеристик и сравнения товаров.',
  parameters: {
    type: 'object',
    properties: {
      productId: {
        type: 'integer',
        description: 'Числовой ID товара из результатов поиска',
      },
    },
    required: ['productId'],
  },
};
