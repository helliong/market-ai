import {
  buildProductTemplateWorkbook,
  parseProductWorkbook,
} from './product-template-xlsx';
import {
  getMainCategoryBySubcategory,
  isProductCategory,
} from './product-categories';

describe('product template xlsx', () => {
  it('parses exported products with legacy categories', () => {
    const workbook = buildProductTemplateWorkbook([
      {
        sku: 'SKU-001',
        name: 'Телевизор',
        description: 'Описание',
        mainCategory: getMainCategoryBySubcategory('ТВ и видеотехника'),
        category: 'ТВ и видеотехника',
        price: 30000,
        stock: 4,
        status: 'active',
      },
    ]);

    expect(parseProductWorkbook(workbook)).toEqual([
      expect.objectContaining({
        rowNumber: 2,
        sku: 'SKU-001',
        category: 'ТВ и видеотехника',
        price: 30000,
        stock: 4,
        status: 'active',
      }),
    ]);
  });

  it('accepts current main and legacy category names', () => {
    expect(isProductCategory('Электроника')).toBe(true);
    expect(isProductCategory('ТВ и видеотехника')).toBe(true);
  });

  it('does not include the legacy Action column', () => {
    const workbook = buildProductTemplateWorkbook([]);

    expect(workbook.includes(Buffer.from('Action'))).toBe(false);
  });

  it('keeps current columns for a custom subcategory', () => {
    const workbook = buildProductTemplateWorkbook([
      {
        sku: 'CPU-001',
        name: 'Процессор',
        description: 'Описание',
        mainCategory: 'Электроника',
        category: 'Процессоры',
        price: 12990,
        oldPrice: 15330,
        stock: 30,
        status: 'active',
      },
    ]);

    expect(parseProductWorkbook(workbook)).toEqual([
      expect.objectContaining({
        sku: 'CPU-001',
        mainCategory: 'Электроника',
        category: 'Процессоры',
        price: 12990,
        oldPrice: 15330,
        stock: 30,
        status: 'active',
      }),
    ]);
  });
});
