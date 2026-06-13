import { CatalogClient } from './catalog-client.service';
import { ChatService } from './chat.service';
import { GigaChatProvider } from './gigachat.provider';
import type { Product } from './chat.types';

describe('ChatService', () => {
  it('executes product search and returns products with the final reply', async () => {
    const product: Product = {
      id: 1,
      sku: 'PHONE-1',
      name: 'Смартфон',
      description: '',
      attributes: {},
      category: 'Смартфоны',
      price: 10000,
      rating: 4.8,
      reviews: 12,
      stock: 3,
      images: [],
    };
    const gigaChat = {
      complete: jest
        .fn()
        .mockResolvedValueOnce({
          choices: [
            {
              message: {
                role: 'assistant',
                content: '',
                function_call: {
                  name: 'searchProducts',
                  arguments: { query: 'смартфон', maxPrice: 15000 },
                },
              },
            },
          ],
        })
        .mockResolvedValueOnce({
          choices: [
            {
              message: {
                role: 'assistant',
                content: 'Нашёл подходящий смартфон.',
              },
            },
          ],
        }),
    } as unknown as GigaChatProvider;
    const searchProducts = jest.fn().mockResolvedValue([product]);
    const catalogClient = { searchProducts } as unknown as CatalogClient;
    const service = new ChatService(gigaChat, catalogClient);

    await expect(
      service.chat({ message: 'Найди смартфон до 15000' }),
    ).resolves.toEqual({
      reply: 'Нашёл подходящий смартфон.',
      products: [product],
    });
    expect(searchProducts).toHaveBeenCalledWith({
      query: 'смартфон',
      maxPrice: 15000,
      category: undefined,
    });
  });
});
