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
});
