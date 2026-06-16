import { CatalogClient } from './catalog-client.service';
import { ChatService } from './chat.service';
import { GigaChatProvider } from './gigachat.provider';
import type { ChatMessage, Product } from './chat.types';

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
      service.chat({ message: 'Найди смартфон' }),
    ).resolves.toMatchObject({
      reply: 'Нашёл подходящий смартфон.',
      products: [product],
    });
    expect(searchProducts).toHaveBeenCalledWith({
      query: 'смартфон',
      maxPrice: 15000,
      category: undefined,
    });
  });

  it('returns a tool error to GigaChat when product details are unavailable', async () => {
    const gigaChatComplete = jest
      .fn()
      .mockResolvedValueOnce({
        choices: [
          {
            message: {
              role: 'assistant',
              content: '',
              function_call: {
                name: 'getProductDetails',
                arguments: { productId: 4278 },
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
              content: 'Уточню товары через поиск.',
            },
          },
        ],
      });
    const gigaChat = {
      complete: gigaChatComplete,
    } as unknown as GigaChatProvider;
    const catalogClient = {
      getProduct: jest.fn().mockRejectedValue(new Error('Not found')),
    } as unknown as CatalogClient;
    const service = new ChatService(gigaChat, catalogClient);

    await expect(
      service.chat({ message: 'Сравни первый и второй товар' }),
    ).resolves.toMatchObject({
      reply: 'Уточню товары через поиск.',
      products: undefined,
    });

    const calls = gigaChatComplete.mock.calls as unknown as Array<
      [ChatMessage[]]
    >;
    const secondCallMessages = calls[1][0];
    expect(JSON.parse(secondCallMessages.at(-1)?.content ?? '{}')).toEqual({
      error:
        'Товар с таким ID не найден. Используй searchProducts, чтобы получить актуальные ID товаров.',
    });
  });

  it('converts a leaked textual searchProducts call into a real tool call', async () => {
    const product: Product = {
      id: 7,
      sku: 'GIFT-7',
      name: 'Умные часы',
      description: '',
      attributes: {},
      category: 'Смарт-часы',
      price: 4990,
      rating: 4.7,
      reviews: 25,
      stock: 8,
      images: [],
    };
    const gigaChatComplete = jest
      .fn()
      .mockResolvedValueOnce({
        choices: [
          {
            message: {
              role: 'assistant',
              content: `searchProducts({
                <|superquote|>category<|superquote|>: <|superquote|>подарки<|superquote|>,
                <|superquote|>query<|superquote|>: <|superquote|>подарок парню<|superquote|>
              })`,
            },
          },
        ],
      })
      .mockResolvedValueOnce({
        choices: [
          {
            message: {
              role: 'assistant',
              content: 'Нашёл реальный вариант из каталога.',
            },
          },
        ],
      });
    const searchProducts = jest.fn().mockResolvedValue([product]);
    const service = new ChatService(
      { complete: gigaChatComplete } as unknown as GigaChatProvider,
      { searchProducts } as unknown as CatalogClient,
    );

    await expect(
      service.chat({ message: 'Подарок для парня на 14 февраля' }),
    ).resolves.toMatchObject({
      reply: 'Нашёл реальный вариант из каталога.',
      products: [product],
    });
    expect(searchProducts).toHaveBeenCalledWith({
      query: 'подарок парню',
      category: 'подарки',
      maxPrice: undefined,
    });
  });

  it('returns diverse products immediately for a gift budget request', async () => {
    const products = Array.from({ length: 5 }, (_, index) => ({
      id: index + 1,
      sku: `GIFT-${index + 1}`,
      name: `Подарок ${index + 1}`,
      description: '',
      attributes: {},
      category: `Категория ${index + 1}`,
      price: 4000 + index * 100,
      rating: 4.5,
      reviews: 10,
      stock: 3,
      images: [],
    })) satisfies Product[];
    const findDiverseProductsUnderPrice = jest.fn().mockResolvedValue(products);
    const complete = jest.fn();
    const gigaChat = {
      complete,
    } as unknown as GigaChatProvider;
    const service = new ChatService(gigaChat, {
      findDiverseProductsUnderPrice,
    } as unknown as CatalogClient);

    await expect(
      service.chat({
        message: 'Подарок до 5000тыс',
      }),
    ).resolves.toMatchObject({
      reply:
        'Вот 5 вариантов до 5 000 ₽. Выберите понравившийся, и я помогу уточнить выбор.',
      products,
    });
    expect(findDiverseProductsUnderPrice).toHaveBeenCalledWith(5000);
    expect(complete).not.toHaveBeenCalled();
  });

  it('keeps the gift budget when the user refines the request to electronics', async () => {
    const products = [
      {
        id: 262,
        sku: 'HEADPHONES-1',
        name: 'Наушники Baseus Bowie MA10',
        description: '',
        attributes: {},
        category: 'Наушники',
        price: 3990,
        rating: 0,
        reviews: 0,
        stock: 5,
        images: [],
      },
      {
        id: 309,
        sku: 'KEYBOARD-1',
        name: 'Клавиатура Logitech K380',
        description: '',
        attributes: {},
        category: 'Клавиатуры',
        price: 3990,
        rating: 0,
        reviews: 0,
        stock: 5,
        images: [],
      },
    ] satisfies Product[];
    const complete = jest.fn();
    const findGiftProductsUnderPrice = jest.fn().mockResolvedValue(products);
    const service = new ChatService(
      { complete } as unknown as GigaChatProvider,
      { findGiftProductsUnderPrice } as unknown as CatalogClient,
    );

    await expect(
      service.chat({
        message: 'технику',
        history: [
          { role: 'user', content: 'Подарок до 11тыс' },
          {
            role: 'assistant',
            content:
              'Вот варианты.\n\nКонтекст показанных товаров: 1) ID 1, Футболка; 2) ID 2, Сетевой адаптер; 3) ID 3, Кулер; 4) ID 4, Клавиатура; 5) ID 5, Наушники.',
          },
          { role: 'user', content: 'ещё' },
          {
            role: 'assistant',
            content: 'Уточните, что именно вы ищете в подарок?',
          },
        ],
      }),
    ).resolves.toMatchObject({
      reply: 'Вот ещё 2 варианта до 11 000 ₽.',
      products,
    });
    expect(findGiftProductsUnderPrice).toHaveBeenCalledWith({
      maxPrice: 11000,
      group: 'electronics',
      excludeProductIds: [1, 2, 3, 4, 5],
    });
    expect(complete).not.toHaveBeenCalled();
  });

  it('returns the next gift products when the user asks for more', async () => {
    const product = {
      id: 10,
      sku: 'GIFT-10',
      name: 'Колонка JBL',
      description: '',
      attributes: {},
      category: 'Портативные колонки',
      price: 9990,
      rating: 0,
      reviews: 0,
      stock: 5,
      images: [],
    } satisfies Product;
    const findGiftProductsUnderPrice = jest.fn().mockResolvedValue([product]);
    const service = new ChatService(
      { complete: jest.fn() } as unknown as GigaChatProvider,
      { findGiftProductsUnderPrice } as unknown as CatalogClient,
    );

    await expect(
      service.chat({
        message: 'ещё',
        history: [
          { role: 'user', content: 'Подарок до 11 тыс' },
          {
            role: 'assistant',
            content:
              'Вот варианты.\n\nКонтекст показанных товаров: 1) ID 1, Футболка.',
          },
        ],
      }),
    ).resolves.toMatchObject({
      reply: 'Вот ещё 1 вариант до 11 000 ₽.',
      products: [product],
    });
    expect(findGiftProductsUnderPrice).toHaveBeenCalledWith({
      maxPrice: 11000,
      group: 'any',
      excludeProductIds: [1],
    });
  });

  it('excludes previously shown products when the user asks for more', async () => {
    const nextProduct = {
      id: 6,
      sku: 'APPLE-6',
      name: 'Apple Watch',
      description: '',
      attributes: {},
      category: 'Смарт-часы',
      price: 39990,
      rating: 4.8,
      reviews: 10,
      stock: 3,
      images: [],
    } satisfies Product;
    const complete = jest
      .fn()
      .mockResolvedValueOnce({
        choices: [
          {
            message: {
              role: 'assistant',
              content: '',
              function_call: {
                name: 'searchProducts',
                arguments: { query: 'Apple' },
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
              content: 'Вот ещё один товар Apple.',
            },
          },
        ],
      });
    const searchProducts = jest.fn().mockResolvedValue([nextProduct]);
    const service = new ChatService(
      { complete } as unknown as GigaChatProvider,
      { searchProducts } as unknown as CatalogClient,
    );

    await expect(
      service.chat({
        message: 'А какие ещё есть?',
        history: [
          { role: 'user', content: 'Покажи товары Apple' },
          {
            role: 'assistant',
            content:
              'Вот товары Apple.\n\nКонтекст показанных товаров: 1) ID 1, AirPods; 2) ID 2, iPhone; 3) ID 3, MacBook; 4) ID 4, iPad; 5) ID 5, Apple Watch.',
          },
        ],
      }),
    ).resolves.toMatchObject({
      reply: 'Вот ещё один товар Apple.',
      products: [nextProduct],
    });
    expect(searchProducts).toHaveBeenCalledWith({
      query: 'Apple',
      excludeProductIds: [1, 2, 3, 4, 5],
      maxPrice: undefined,
      category: undefined,
    });
  });

  it('returns another page of the same product type without relying on the model', async () => {
    const products = [
      {
        id: 141,
        sku: 'STYLEUP-PM-030',
        name: 'Шорты Puma Essentials, серые',
        description: '',
        attributes: {},
        category: 'Шорты',
        price: 3290,
        rating: 0,
        reviews: 0,
        stock: 14,
        images: [],
      },
      {
        id: 129,
        sku: 'STYLEUP-AD-018',
        name: 'Шорты adidas Tiro 23 League, темно-синие',
        description: '',
        attributes: {},
        category: 'Шорты',
        price: 3990,
        rating: 0,
        reviews: 0,
        stock: 10,
        images: [],
      },
    ] satisfies Product[];
    const complete = jest.fn();
    const searchProducts = jest.fn().mockResolvedValue(products);
    const service = new ChatService(
      { complete } as unknown as GigaChatProvider,
      { searchProducts } as unknown as CatalogClient,
    );

    await expect(
      service.chat({
        message: 'ещё шорты',
        history: [
          { role: 'user', content: 'шорты' },
          {
            role: 'assistant',
            content:
              'Вот варианты.\n\nКонтекст показанных товаров: 1) ID 181, Шорты Nike Dri-FIT Park; 2) ID 182, Шорты Nike Dri-FIT Park, коричневые; 3) ID 154, Шорты Reebok Workout Ready, синие; 4) ID 153, Шорты Reebok Identity, черные; 5) ID 142, Шорты Puma TeamLIGA, черные.',
          },
        ],
      }),
    ).resolves.toMatchObject({
      reply: 'Вот ещё 2 товара по запросу «шорты».',
      products,
    });
    expect(searchProducts).toHaveBeenCalledWith({
      query: 'шорты',
      excludeProductIds: [181, 182, 154, 153, 142],
    });
    expect(complete).not.toHaveBeenCalled();
  });

  it('returns product cards when the model references shown product IDs in the reply', async () => {
    const products = [
      {
        id: 182,
        sku: 'STYLEUP-NK-0556',
        name: 'Шорты Nike Dri-FIT Park, коричневые',
        description: '',
        attributes: {},
        category: 'Шорты',
        price: 4300,
        rating: 0,
        reviews: 0,
        stock: 1,
        images: [],
      },
      {
        id: 154,
        sku: 'STYLEUP-RB-043',
        name: 'Шорты Reebok Workout Ready, синие',
        description: '',
        attributes: {},
        category: 'Шорты',
        price: 3490,
        rating: 0,
        reviews: 0,
        stock: 11,
        images: [],
      },
    ] satisfies Product[];
    const complete = jest.fn().mockResolvedValueOnce({
      choices: [
        {
          message: {
            role: 'assistant',
            content:
              'Лучше рассмотреть 1. **ID 182, Шорты Nike Dri-FIT Park** и 2. **ID 154, Шорты Reebok Workout Ready**.',
          },
        },
      ],
    });
    const getProduct = jest
      .fn()
      .mockResolvedValueOnce(products[0])
      .mockResolvedValueOnce(products[1]);
    const service = new ChatService(
      { complete } as unknown as GigaChatProvider,
      { getProduct } as unknown as CatalogClient,
    );

    await expect(
      service.chat({
        message: 'Какие шорты лучше взять',
        history: [
          { role: 'user', content: 'шорты' },
          {
            role: 'assistant',
            content:
              'Вот варианты.\n\nКонтекст показанных товаров: 1) ID 182, Шорты Nike Dri-FIT Park; 2) ID 154, Шорты Reebok Workout Ready; 3) ID 153, Шорты Reebok Identity.',
          },
        ],
      }),
    ).resolves.toMatchObject({
      reply:
        'Лучше рассмотреть 1. **ID 182, Шорты Nike Dri-FIT Park** и 2. **ID 154, Шорты Reebok Workout Ready**.',
      products,
    });
    expect(getProduct).toHaveBeenNthCalledWith(1, 182);
    expect(getProduct).toHaveBeenNthCalledWith(2, 154);
  });

  it('parses function_call arguments provided as a JSON string', async () => {
    const product: Product = {
      id: 10,
      sku: 'LAPTOP-10',
      name: 'Ноутбук',
      description: '',
      attributes: {},
      category: 'Ноутбуки',
      price: 85000,
      rating: 4.6,
      reviews: 30,
      stock: 5,
      images: [],
    };
    const gigaChatComplete = jest
      .fn()
      .mockResolvedValueOnce({
        choices: [
          {
            message: {
              role: 'assistant',
              content: '',
              function_call: {
                name: 'searchProducts',
                arguments: '{"query": "ноутбук", "maxPrice": 100000}',
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
              content: 'Вот ноутбуки до 100 000 ₽.',
            },
          },
        ],
      });
    const searchProducts = jest.fn().mockResolvedValue([product]);
    const service = new ChatService(
      { complete: gigaChatComplete } as unknown as GigaChatProvider,
      { searchProducts } as unknown as CatalogClient,
    );

    await expect(
      service.chat({ message: 'Подбери ноутбук' }),
    ).resolves.toMatchObject({
      reply: 'Вот ноутбуки до 100 000 ₽.',
      products: [product],
    });
    expect(searchProducts).toHaveBeenCalledWith({
      query: 'ноутбук',
      maxPrice: 100000,
      category: undefined,
    });
  });

  it('searches budgeted mouse requests with k shorthand without relying on the model', async () => {
    const mouse = {
      id: 317,
      sku: 'MOUSE-317',
      name: 'Мышь A4Tech Bloody W90 Max',
      description: '',
      attributes: {},
      category: 'Мыши',
      price: 2990,
      rating: 0,
      reviews: 0,
      stock: 10,
      images: [],
    } satisfies Product;
    const complete = jest.fn();
    const searchProducts = jest.fn().mockResolvedValue([mouse]);
    const service = new ChatService(
      { complete } as unknown as GigaChatProvider,
      { searchProducts } as unknown as CatalogClient,
    );

    await expect(
      service.chat({ message: 'игровая мышка до 5к' }),
    ).resolves.toMatchObject({
      reply: 'Нашёл 1 товар до 5 000 ₽.',
      products: [mouse],
    });
    expect(searchProducts).toHaveBeenCalledWith({
      query: 'мышь',
      maxPrice: 5000,
    });
    expect(complete).not.toHaveBeenCalled();
  });

  it('uses the previous product type when the user only changes the budget', async () => {
    const products = [
      {
        id: 318,
        sku: 'MOUSE-318',
        name: 'Мышь SteelSeries Rival 3 Wireless',
        description: '',
        attributes: {},
        category: 'Мыши',
        price: 5990,
        rating: 0,
        reviews: 0,
        stock: 10,
        images: [],
      },
      {
        id: 317,
        sku: 'MOUSE-317',
        name: 'Мышь A4Tech Bloody W90 Max',
        description: '',
        attributes: {},
        category: 'Мыши',
        price: 2990,
        rating: 0,
        reviews: 0,
        stock: 10,
        images: [],
      },
    ] satisfies Product[];
    const complete = jest.fn();
    const searchProducts = jest.fn().mockResolvedValue(products);
    const service = new ChatService(
      { complete } as unknown as GigaChatProvider,
      { searchProducts } as unknown as CatalogClient,
    );

    await expect(
      service.chat({
        message: 'до 10к',
        history: [
          { role: 'user', content: 'игровая мышка до 7к' },
          {
            role: 'assistant',
            content:
              'Нашёл 2 товара до 7 000 ₽.\n\nКонтекст показанных товаров: 1) ID 318, Мышь SteelSeries Rival 3 Wireless; 2) ID 317, Мышь A4Tech Bloody W90 Max.',
          },
        ],
      }),
    ).resolves.toMatchObject({
      reply: 'Нашёл 2 товара по запросу «мышь» до 10 000 ₽.',
      products,
    });
    expect(searchProducts).toHaveBeenCalledWith({
      query: 'мышь',
      maxPrice: 10000,
    });
    expect(complete).not.toHaveBeenCalled();
  });

  it('uses conversation state when the user changes the budget without history context', async () => {
    const mouse = {
      id: 315,
      sku: 'MOUSE-315',
      name: 'Мышь Razer DeathAdder V3',
      description: '',
      attributes: {},
      category: 'Мыши',
      price: 7990,
      rating: 0,
      reviews: 0,
      stock: 10,
      images: [],
    } satisfies Product;
    const complete = jest.fn();
    const searchProducts = jest.fn().mockResolvedValue([mouse]);
    const service = new ChatService(
      { complete } as unknown as GigaChatProvider,
      { searchProducts } as unknown as CatalogClient,
    );

    await expect(
      service.chat({
        message: 'до 10к',
        history: [],
        conversationState: {
          productType: 'мышь',
          maxPrice: 7000,
          shownProductIds: [316, 317],
          lastQuery: 'игровая мышка до 7к',
        },
      }),
    ).resolves.toMatchObject({
      reply: 'Нашёл 1 товар по запросу «мышь» до 10 000 ₽.',
      products: [mouse],
      conversationState: {
        productType: 'мышь',
        maxPrice: 10000,
        shownProductIds: [315],
        lastQuery: 'до 10к',
      },
    });
    expect(searchProducts).toHaveBeenCalledWith({
      query: 'мышь',
      maxPrice: 10000,
    });
    expect(complete).not.toHaveBeenCalled();
  });

  it('searches with the proposed budget when the user confirms it', async () => {
    const laptop = {
      id: 228,
      sku: 'ELEC-041',
      name: 'Ноутбук Lenovo IdeaPad Slim 3 16/512GB',
      description: '',
      attributes: {},
      category: 'Ноутбуки',
      price: 49990,
      rating: 0,
      reviews: 0,
      stock: 10,
      images: [],
    } satisfies Product;
    const complete = jest.fn();
    const searchProducts = jest.fn().mockResolvedValue([laptop]);
    const service = new ChatService(
      { complete } as unknown as GigaChatProvider,
      { searchProducts } as unknown as CatalogClient,
    );

    await expect(
      service.chat({
        message: 'да',
        history: [
          {
            role: 'user',
            content: 'Ноутбук для программирования',
          },
          {
            role: 'assistant',
            content:
              'Уточните, важен ли для вас бюджет? Например, до 50 000 рублей?',
          },
        ],
      }),
    ).resolves.toMatchObject({
      reply: 'Нашёл 1 товар до 50 000 ₽.',
      products: [laptop],
    });
    expect(searchProducts).toHaveBeenCalledWith({
      query: 'ноутбук',
      maxPrice: 50000,
    });
    expect(complete).not.toHaveBeenCalled();
  });

  it('returns product cards when the user rejects an already shown product type', async () => {
    const gamepad = {
      id: 320,
      sku: 'GAMEPAD-1',
      name: 'Геймпад Xbox Series X|S',
      description: '',
      attributes: {},
      category: 'Геймпады',
      price: 11990,
      rating: 0,
      reviews: 0,
      stock: 10,
      images: [],
    } satisfies Product;
    const keyboard = {
      ...gamepad,
      id: 321,
      sku: 'KEYBOARD-1',
      name: 'Клавиатура механическая SteelSeries Apex M500',
      category: 'Клавиатуры',
      price: 10990,
    };
    const complete = jest.fn();
    const searchProducts = jest
      .fn()
      .mockResolvedValueOnce([gamepad])
      .mockResolvedValueOnce([keyboard]);
    const service = new ChatService(
      { complete } as unknown as GigaChatProvider,
      { searchProducts } as unknown as CatalogClient,
    );

    await expect(
      service.chat({
        message: 'мышка уже есть',
        history: [
          { role: 'user', content: 'Покажи компьютерные мышки' },
          {
            role: 'assistant',
            content:
              'Вот мышки.\n\nКонтекст показанных товаров: 1) ID 313, Мышь Logitech; 2) ID 314, Мышь Razer.',
          },
        ],
      }),
    ).resolves.toMatchObject({
      reply: 'Тогда вот несколько альтернатив из каталога.',
      products: [gamepad, keyboard],
    });
    expect(searchProducts).toHaveBeenNthCalledWith(1, {
      query: 'геймпад',
      excludeProductIds: [313, 314],
    });
    expect(searchProducts).toHaveBeenNthCalledWith(2, {
      query: 'клавиатура',
      excludeProductIds: [313, 314],
    });
    expect(complete).not.toHaveBeenCalled();
  });

  it('searches smart watches directly without relying on a model tool call', async () => {
    const watch = {
      id: 368,
      sku: 'WATCH-1',
      name: 'Смарт-часы Samsung Galaxy Watch Ultra 47mm',
      description: '',
      attributes: {},
      category: 'Смарт-часы',
      price: 59990,
      rating: 0,
      reviews: 0,
      stock: 10,
      images: [],
    } satisfies Product;
    const complete = jest.fn();
    const searchProducts = jest.fn().mockResolvedValue([watch]);
    const service = new ChatService(
      { complete } as unknown as GigaChatProvider,
      { searchProducts } as unknown as CatalogClient,
    );

    await expect(
      service.chat({
        message: 'Умные часы для спорта',
      }),
    ).resolves.toMatchObject({
      reply: 'Нашёл умные часы в каталоге. Вот доступные варианты.',
      products: [watch],
    });
    expect(searchProducts).toHaveBeenCalledWith({
      query: 'смарт-часы',
    });
    expect(complete).not.toHaveBeenCalled();
  });
});

