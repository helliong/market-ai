import { of } from 'rxjs';
import { CatalogClient } from './catalog-client.service';
import type { Product } from './chat.types';

describe('CatalogClient', () => {
  const mouse = {
    id: 1,
    sku: 'MOUSE-1',
    name: 'Беспроводная мышь',
    description: '',
    attributes: {},
    category: 'Компьютерные аксессуары',
    price: 2500,
    rating: 4.8,
    reviews: 20,
    stock: 5,
    images: [],
  } satisfies Product;

  it.each(['мышка', 'компьютерная мышка', 'КОМПЬЮТЕРНАЯ мышка'])(
    'normalizes "%s" to the catalog term',
    async (query) => {
      const get = jest.fn().mockReturnValue(of({ data: [mouse] }));
      const client = new CatalogClient(
        { get } as never,
        { get: jest.fn().mockReturnValue('http://catalog') } as never,
      );

      await expect(client.searchProducts({ query })).resolves.toEqual([mouse]);
      expect(get).toHaveBeenCalledWith('http://catalog/products/search', {
        params: { q: 'мышь' },
      });
    },
  );

  it('excludes products that were already shown before applying the limit', async () => {
    const products = Array.from({ length: 7 }, (_, index) => ({
      ...mouse,
      id: index + 1,
      sku: `APPLE-${index + 1}`,
      name: `Apple product ${index + 1}`,
    }));
    const get = jest.fn().mockReturnValue(of({ data: products }));
    const client = new CatalogClient(
      { get } as never,
      { get: jest.fn().mockReturnValue('http://catalog') } as never,
    );

    await expect(
      client.searchProducts({
        query: 'Apple',
        excludeProductIds: [1, 2, 3, 4, 5],
      }),
    ).resolves.toEqual(products.slice(5));
  });

  it('filters gift electronics by budget and excludes clothing and shown products', async () => {
    const clothing = {
      ...mouse,
      id: 2,
      sku: 'SHIRT-2',
      name: 'Футболка',
      category: 'Футболки',
      price: 3000,
    };
    const expensive = {
      ...mouse,
      id: 3,
      sku: 'HEADPHONES-3',
      name: 'Наушники',
      category: 'Наушники',
      price: 15000,
    };
    const keyboard = {
      ...mouse,
      id: 4,
      sku: 'KEYBOARD-4',
      name: 'Клавиатура',
      category: 'Клавиатуры',
      price: 9990,
    };
    const get = jest
      .fn()
      .mockReturnValue(of({ data: [mouse, clothing, expensive, keyboard] }));
    const client = new CatalogClient(
      { get } as never,
      { get: jest.fn().mockReturnValue('http://catalog') } as never,
    );

    await expect(
      client.findGiftProductsUnderPrice({
        maxPrice: 11000,
        group: 'electronics',
        excludeProductIds: [mouse.id],
      }),
    ).resolves.toEqual([keyboard]);
  });

  it('reduces a laptop use-case request to the catalog product type', async () => {
    const laptop = {
      ...mouse,
      id: 10,
      sku: 'LAPTOP-10',
      name: 'Ноутбук Lenovo IdeaPad Slim 3 16/512GB',
      category: 'Ноутбуки',
      price: 49990,
    };
    const get = jest.fn().mockReturnValue(of({ data: [laptop] }));
    const client = new CatalogClient(
      { get } as never,
      { get: jest.fn().mockReturnValue('http://catalog') } as never,
    );

    await expect(
      client.searchProducts({
        query: 'ноутбук для программирования',
        maxPrice: 50000,
      }),
    ).resolves.toEqual([laptop]);
    expect(get).toHaveBeenCalledWith('http://catalog/products/search', {
      params: { q: 'ноутбук' },
    });
  });

  it.each(['умные часы для спорта', 'часы для спорта', 'умные наручные часы'])(
    'normalizes the smart watch synonym "%s"',
    async (query) => {
      const watch = {
        ...mouse,
        id: 20,
        sku: 'WATCH-20',
        name: 'Смарт-часы Samsung Galaxy Watch7 44mm',
        category: 'Смарт-часы',
        price: 29990,
      };
      const get = jest.fn().mockReturnValue(of({ data: [watch] }));
      const client = new CatalogClient(
        { get } as never,
        { get: jest.fn().mockReturnValue('http://catalog') } as never,
      );

      await expect(client.searchProducts({ query })).resolves.toEqual([watch]);
      expect(get).toHaveBeenCalledWith('http://catalog/products/search', {
        params: { q: 'смарт-часы' },
      });
    },
  );
});
