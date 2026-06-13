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
});
