import { inflateRawSync } from 'node:zlib';
import {
  isProductCategory,
  productMainCategories,
  productCategoriesTree,
  getMainCategoryBySubcategory,
} from './product-categories';
import { productStatuses, type ProductStatus } from './dto/create-product.dto';

export type ProductTemplateRow = {
  sku: string;
  name: string;
  description: string;
  mainCategory?: string;
  category: string;
  price: number;
  oldPrice?: number;
  stock: number;
  status: ProductStatus;
  action?: ProductTemplateAction | '';
};

export const productTemplateActions = ['delete'] as const;
export type ProductTemplateAction = (typeof productTemplateActions)[number];

const productAttributeHeaders = [
  'Цвет',
  'Размер',
  'Память',
  'Материал',
  'Бренд',
  'Страна производства',
  'Штрихкод',
  'Пол',
  'Сезон',
  'Диагональ',
  'Процессор',
  'Гарантия',
  'Объем',
  'Комплектация',
];

export function buildProductTemplateWorkbook(products: ProductTemplateRow[]) {
  const files = new Map<string, Buffer>();
  const categoryTemplateSheets = productMainCategories.map((mainCategory, index) => ({
    mainCategory,
    name: sanitizeSheetName(mainCategory),
    sheetId: index + 3,
    relId: `rId${index + 3}`,
    path: `xl/worksheets/sheet${index + 3}.xml`,
    target: `worksheets/sheet${index + 3}.xml`,
  }));

  files.set(
    '[Content_Types].xml',
    text(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/docProps/app.xml" ContentType="application/vnd.openxmlformats-officedocument.extended-properties+xml"/>
  <Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/>
  <Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>
  <Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>
  <Override PartName="/xl/worksheets/sheet2.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>
${categoryTemplateSheets
  .map(
    (sheet) =>
      `  <Override PartName="/${sheet.path}" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`,
  )
  .join('\n')}
  <Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>
</Types>`),
  );
  files.set(
    '_rels/.rels',
    text(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>
  <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/>
  <Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/extended-properties" Target="docProps/app.xml"/>
</Relationships>`),
  );
  files.set(
    'docProps/app.xml',
    text(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Properties xmlns="http://schemas.openxmlformats.org/officeDocument/2006/extended-properties">
  <Application>MarketAI</Application>
</Properties>`),
  );
  files.set(
    'docProps/core.xml',
    text(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:dcterms="http://purl.org/dc/terms/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
  <dc:title>MarketAI product import template</dc:title>
  <dc:creator>MarketAI</dc:creator>
  <dcterms:created xsi:type="dcterms:W3CDTF">2026-06-04T00:00:00Z</dcterms:created>
  <dcterms:modified xsi:type="dcterms:W3CDTF">2026-06-04T00:00:00Z</dcterms:modified>
</cp:coreProperties>`),
  );
  files.set(
    'xl/workbook.xml',
    text(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <sheets>
    <sheet name="Products" sheetId="1" r:id="rId1"/>
    <sheet name="Categories" sheetId="2" r:id="rId2"/>
${categoryTemplateSheets
  .map(
    (sheet) =>
      `    <sheet name="${encodeXml(sheet.name)}" sheetId="${sheet.sheetId}" r:id="${sheet.relId}"/>`,
  )
  .join('\n')}
  </sheets>
  <definedNames>
${productMainCategories
  .map((mainCat, idx) => {
    const subcats = productCategoriesTree[mainCat];
    const colName = String.fromCharCode(66 + idx);
    const rangeName = mainCat.replace(/[\s\-]/g, '_').replace(/^[0-9]/, '_$&');
    return `    <definedName name="${rangeName}">Categories!$${colName}$2:$${colName}$${subcats.length + 1}</definedName>`;
  })
  .join('\n')}
  </definedNames>
</workbook>`),
  );
  files.set(
    'xl/_rels/workbook.xml.rels',
    text(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/>
  <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet2.xml"/>
${categoryTemplateSheets
  .map(
    (sheet) =>
      `  <Relationship Id="${sheet.relId}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="${sheet.target}"/>`,
  )
  .join('\n')}
  <Relationship Id="rIdStyles" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
</Relationships>`),
  );
  files.set(
    'xl/styles.xml',
    text(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <fonts count="2"><font><sz val="11"/><name val="Calibri"/></font><font><b/><sz val="11"/><color rgb="FFFFFFFF"/><name val="Calibri"/></font></fonts>
  <fills count="3"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill><fill><patternFill patternType="solid"><fgColor rgb="FF2563EB"/></patternFill></fill></fills>
  <borders count="2"><border><left/><right/><top/><bottom/><diagonal/></border><border><left style="thin"/><right style="thin"/><top style="thin"/><bottom style="thin"/><diagonal/></border></borders>
  <cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>
  <cellXfs count="3"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/><xf numFmtId="0" fontId="1" fillId="2" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1"/><xf numFmtId="0" fontId="0" fillId="0" borderId="1" xfId="0" applyBorder="1"/></cellXfs>
  <cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles>
</styleSheet>`),
  );
  files.set('xl/worksheets/sheet1.xml', text(buildProductsSheet(products)));
  files.set('xl/worksheets/sheet2.xml', text(buildCategoriesSheet()));
  categoryTemplateSheets.forEach((sheet) => {
    files.set(
      sheet.path,
      text(
        buildCategoryTemplateSheet(
          sheet.mainCategory,
          products.filter(
            (product) =>
              (product.mainCategory ?? getMainCategoryBySubcategory(product.category)) ===
              sheet.mainCategory,
          ),
        ),
      ),
    );
  });

  return writeZip(files);
}

export function parseProductWorkbook(buffer: Buffer) {
  const files = readZip(buffer);
  const productsSheet = files.get('xl/worksheets/sheet1.xml');

  if (!productsSheet) {
    throw new Error('В файле не найден лист Products');
  }

  const sharedStrings = parseSharedStrings(files.get('xl/sharedStrings.xml'));
  const productRows = parseRows(productsSheet.toString('utf8'), sharedStrings)
    .slice(1)
    .flatMap((row, index) => {
      const parsedRow = parseProductRow(row, index + 2);
      return isEmptyTemplateRow(parsedRow) ? [] : [parsedRow];
    });
  const rowsBySku = new Map(
    productRows.map((row) => [row.sku.trim().toUpperCase(), row]),
  );

  productMainCategories.forEach((mainCategory, index) => {
    const sheet = files.get(`xl/worksheets/sheet${index + 3}.xml`);

    if (!sheet) {
      return;
    }

    parseRows(sheet.toString('utf8'), sharedStrings)
      .slice(1)
      .forEach((row, rowIndex) => {
        const parsedRow = parseCategoryProductRow(row, rowIndex + 2, mainCategory);

        if (isEmptyTemplateRow(parsedRow)) {
          return;
        }

        const sku = parsedRow.sku.trim().toUpperCase();
        const existingRow = rowsBySku.get(sku);
        rowsBySku.set(sku, existingRow ? mergeTemplateRows(existingRow, parsedRow) : parsedRow);
      });
  });

  return [...rowsBySku.values()];
}

function isEmptyTemplateRow(parsedRow: ReturnType<typeof parseProductRow>) {
  return (
    !parsedRow.sku &&
    !parsedRow.name &&
    !parsedRow.category &&
    parsedRow.price === 0 &&
    parsedRow.stock === 0 &&
    !parsedRow.action
  );
}

function mergeTemplateRows(
  baseRow: ReturnType<typeof parseProductRow>,
  categoryRow: ReturnType<typeof parseProductRow>,
) {
  return {
    ...baseRow,
    name: categoryRow.name || baseRow.name,
    mainCategory: categoryRow.mainCategory || baseRow.mainCategory,
    category: categoryRow.category || baseRow.category,
    price: categoryRow.price || baseRow.price,
    oldPrice: categoryRow.oldPrice ?? baseRow.oldPrice,
    stock: categoryRow.stock || baseRow.stock,
    status: categoryRow.status || baseRow.status,
    description: categoryRow.description || baseRow.description,
    action: categoryRow.action || baseRow.action,
  };
}

function parseCategoryProductRow(
  row: Record<string, string>,
  rowNumber: number,
  mainCategory: string,
) {
  const attributeHeaders = getCategoryAttributeHeaders(mainCategory);
  const attributes = Object.fromEntries(
    attributeHeaders.map((header, index) => [
      header,
      row[columnName(10 + index)],
    ]),
  );
  const actionColumn = columnName(10 + attributeHeaders.length);
  const oldPrice = parseNumber(row.F);

  return {
    rowNumber,
    sku: stringValue(row.A).trim(),
    name: stringValue(row.B).trim(),
    mainCategory: stringValue(row.C).trim() || mainCategory,
    category: stringValue(row.D).trim(),
    price: parseNumber(row.E),
    oldPrice: oldPrice === 0 ? undefined : oldPrice,
    stock: parseNumber(row.G),
    status: stringValue(row.H).trim() || 'active',
    description: buildDescriptionWithAttributes(stringValue(row.I).trim(), attributes),
    action: stringValue(row[actionColumn]).trim().toLowerCase(),
  };
}
function parseProductRow(row: Record<string, string>, rowNumber: number) {
  const currentCategory = stringValue(row.D).trim();
  const legacyCategory = stringValue(row.C).trim();

  if (!isProductCategory(currentCategory) && isProductCategory(legacyCategory)) {
    const oldPrice = parseNumber(row.F);

    return {
      rowNumber,
      sku: stringValue(row.A).trim(),
      name: stringValue(row.B).trim(),
      category: legacyCategory,
      price: parseNumber(row.D),
      oldPrice: oldPrice === 0 ? undefined : oldPrice,
      stock: parseNumber(row.E),
      status: stringValue(row.F).trim() || 'active',
      description: stringValue(row.G).trim(),
      action: stringValue(row.H).trim().toLowerCase(),
    };
  }

  const oldPrice = parseNumber(row.F);
  const attributes = Object.fromEntries(
    productAttributeHeaders.map((header, index) => [
      header,
      row[columnName(10 + index)],
    ]),
  );
  const actionColumn = columnName(10 + productAttributeHeaders.length);
  const description = buildDescriptionWithAttributes(stringValue(row.I).trim(), attributes);

  return {
    rowNumber,
    sku: stringValue(row.A).trim(),
    name: stringValue(row.B).trim(),
    mainCategory: legacyCategory,
    category: currentCategory,
    price: parseNumber(row.E),
    oldPrice: oldPrice === 0 ? undefined : oldPrice,
    stock: parseNumber(row.G),
    status: stringValue(row.H).trim() || 'active',
    description,
    action: stringValue(row[actionColumn]).trim().toLowerCase(),
  };
}

function buildProductsSheet(products: ProductTemplateRow[]) {
  const headers = [
    'SKU',
    'Название',
    'Основная категория',
    'Подкатегория',
    'Цена',
    'Старая цена',
    'Остаток',
    'Статус',
    'Описание',
    ...productAttributeHeaders,
    'Action',
  ];
  const actionColumn = columnName(headers.length);

  const headerCells = headers
    .map((header, index) =>
      inlineCell(`${columnName(index + 1)}1`, header, 1),
    )
    .join('');
  const rows = products
    .map((product, index) => {
      const row = index + 2;
      const parsedDescription = parseDescriptionAttributes(product.description);
      const attributeCells = productAttributeHeaders.map((header, attrIndex) =>
        inlineCell(
          `${columnName(10 + attrIndex)}${row}`,
          parsedDescription.attributes[header] ?? '',
          2,
        ),
      );

      return `<row r="${row}">${[
        inlineCell(`A${row}`, product.sku, 2),
        inlineCell(`B${row}`, product.name, 2),
        inlineCell(`C${row}`, product.mainCategory ?? '', 2),
        inlineCell(`D${row}`, product.category, 2),
        numberCell(`E${row}`, product.price, 2),
        product.oldPrice
          ? numberCell(`F${row}`, product.oldPrice, 2)
          : inlineCell(`F${row}`, '', 2),
        numberCell(`G${row}`, product.stock, 2),
        formulaStrCell(
          `H${row}`,
          `IF(G${row}=0,"draft","active")`,
          product.status,
          2,
        ),
        inlineCell(`I${row}`, parsedDescription.description, 2),
        ...attributeCells,
        inlineCell(`${actionColumn}${row}`, product.action ?? '', 2),
      ].join('')}</row>`;
    })
    .join('');

  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <dimension ref="A1:${actionColumn}500"/>
  <sheetViews><sheetView workbookViewId="0"><pane ySplit="1" topLeftCell="A2" activePane="bottomLeft" state="frozen"/></sheetView></sheetViews>
  <cols><col min="1" max="1" width="18" customWidth="1"/><col min="2" max="2" width="32" customWidth="1"/><col min="3" max="3" width="22" customWidth="1"/><col min="4" max="4" width="26" customWidth="1"/><col min="5" max="6" width="14" customWidth="1"/><col min="7" max="7" width="14" customWidth="1"/><col min="8" max="8" width="14" customWidth="1"/><col min="9" max="9" width="44" customWidth="1"/><col min="10" max="${headers.length - 1}" width="18" customWidth="1"/><col min="${headers.length}" max="${headers.length}" width="16" customWidth="1"/></cols>
  <sheetData><row r="1">${headerCells}</row>${rows}</sheetData>
  <dataValidations count="7">
    <dataValidation type="list" allowBlank="0" showErrorMessage="1" sqref="C2:C500"><formula1>Categories!$A$2:$A$${productMainCategories.length + 1}</formula1></dataValidation>
    <dataValidation type="list" allowBlank="0" showErrorMessage="1" sqref="D2:D500"><formula1>INDIRECT(SUBSTITUTE(SUBSTITUTE($C2, &quot; &quot;, &quot;_&quot;), &quot;-&quot;, &quot;_&quot;))</formula1></dataValidation>
    <dataValidation type="whole" operator="greaterThanOrEqual" allowBlank="0" showErrorMessage="1" sqref="E2:E500"><formula1>1</formula1></dataValidation>
    <dataValidation type="whole" operator="greaterThanOrEqual" allowBlank="1" showErrorMessage="1" sqref="F2:F500"><formula1>1</formula1></dataValidation>
    <dataValidation type="whole" operator="greaterThanOrEqual" allowBlank="0" showErrorMessage="1" sqref="G2:G500"><formula1>0</formula1></dataValidation>
    <dataValidation type="list" allowBlank="0" showErrorMessage="1" sqref="H2:H500"><formula1>&quot;active,draft,archived&quot;</formula1></dataValidation>
    <dataValidation type="list" allowBlank="1" showErrorMessage="1" sqref="${actionColumn}2:${actionColumn}500"><formula1>&quot;delete&quot;</formula1></dataValidation>
  </dataValidations>
</worksheet>`;
}
function buildCategoriesSheet() {
  const rowsXml: string[] = [];
  
  let headerRow = `<row r="1">${inlineCell('A1', 'Основная категория', 1)}`;
  productMainCategories.forEach((mainCat, idx) => {
    headerRow += inlineCell(`${String.fromCharCode(66 + idx)}1`, mainCat, 1);
  });
  headerRow += '</row>';
  rowsXml.push(headerRow);

  let maxRows = productMainCategories.length;
  for (const mainCat of productMainCategories) {
    if (productCategoriesTree[mainCat].length > maxRows) {
      maxRows = productCategoriesTree[mainCat].length;
    }
  }

  for (let i = 0; i < maxRows; i++) {
    const rowNum = i + 2;
    let rowContent = `<row r="${rowNum}">`;
    
    if (i < productMainCategories.length) {
      rowContent += inlineCell(`A${rowNum}`, productMainCategories[i], 2);
    }
    
    productMainCategories.forEach((mainCat, idx) => {
      const subcats = productCategoriesTree[mainCat];
      if (i < subcats.length) {
         const colName = String.fromCharCode(66 + idx);
         rowContent += inlineCell(`${colName}${rowNum}`, subcats[i], 2);
      }
    });
    rowContent += '</row>';
    rowsXml.push(rowContent);
  }

  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <dimension ref="A1:${String.fromCharCode(65 + productMainCategories.length)}${maxRows + 1}"/>
  <sheetViews><sheetView workbookViewId="0"/></sheetViews>
  <cols><col min="1" max="1" width="30" customWidth="1"/></cols>
  <sheetData>${rowsXml.join('')}</sheetData>
</worksheet>`;
}

function buildCategoryTemplateSheet(
  mainCategory: string,
  products: ProductTemplateRow[],
) {
  const attributeHeaders = getCategoryAttributeHeaders(mainCategory);
  const headers = [
    'SKU',
    'Название',
    'Основная категория',
    'Подкатегория',
    'Цена',
    'Старая цена',
    'Остаток',
    'Статус',
    'Описание',
    ...attributeHeaders,
    'Action',
  ];
  const headerCells = headers
    .map((header, index) =>
      inlineCell(`${columnName(index + 1)}1`, header, 1),
    )
    .join('');
  const lastColumn = columnName(headers.length);
  const actionColumn = columnName(headers.length);
  const rows = products
    .map((product, index) => {
      const row = index + 2;
      const parsedDescription = parseDescriptionAttributes(product.description);
      const attributeCells = attributeHeaders.map((header, attrIndex) =>
        inlineCell(
          `${columnName(10 + attrIndex)}${row}`,
          parsedDescription.attributes[header] ?? '',
          2,
        ),
      );

      return `<row r="${row}">${[
        inlineCell(`A${row}`, product.sku, 2),
        inlineCell(`B${row}`, product.name, 2),
        inlineCell(`C${row}`, product.mainCategory ?? mainCategory, 2),
        inlineCell(`D${row}`, product.category, 2),
        numberCell(`E${row}`, product.price, 2),
        product.oldPrice
          ? numberCell(`F${row}`, product.oldPrice, 2)
          : inlineCell(`F${row}`, '', 2),
        numberCell(`G${row}`, product.stock, 2),
        formulaStrCell(
          `H${row}`,
          `IF(G${row}=0,"draft","active")`,
          product.status,
          2,
        ),
        inlineCell(`I${row}`, parsedDescription.description, 2),
        ...attributeCells,
        inlineCell(`${actionColumn}${row}`, product.action ?? '', 2),
      ].join('')}</row>`;
    })
    .join('');

  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <dimension ref="A1:${lastColumn}500"/>
  <sheetViews><sheetView workbookViewId="0"><pane ySplit="1" topLeftCell="A2" activePane="bottomLeft" state="frozen"/></sheetView></sheetViews>
  <cols><col min="1" max="${headers.length}" width="18" customWidth="1"/></cols>
  <sheetData><row r="1">${headerCells}</row>${rows}</sheetData>
  <dataValidations count="1">
    <dataValidation type="list" allowBlank="1" showErrorMessage="1" sqref="${actionColumn}2:${actionColumn}500"><formula1>&quot;delete&quot;</formula1></dataValidation>
  </dataValidations>
</worksheet>`;
}
function getCategoryAttributeHeaders(mainCategory: string) {
  const normalized = mainCategory.toLowerCase();

  if (normalized.includes('одеж') || normalized.includes('обув') || normalized.includes('спорт')) {
    return ['Цвет', 'Размер', 'Материал', 'Пол', 'Сезон', 'Бренд', 'Страна производства', 'Штрихкод'];
  }

  if (normalized.includes('элект') || normalized.includes('Р­')) {
    return ['Цвет', 'Память', 'Диагональ', 'Процессор', 'Гарантия', 'Бренд', 'Страна производства', 'Штрихкод'];
  }

  if (normalized.includes('дом')) {
    return ['Цвет', 'Размер', 'Материал', 'Объем', 'Комплектация', 'Бренд', 'Страна производства', 'Штрихкод'];
  }

  return ['Цвет', 'Размер', 'Материал', 'Бренд', 'Страна производства', 'Штрихкод'];
}

function buildDescriptionWithAttributes(
  description: string,
  attributes: Record<string, string | undefined>,
) {
  const rows = Object.entries(attributes)
    .map(([label, value]) => [label, stringValue(value).trim()] as const)
    .filter(([, value]) => value.length > 0);

  if (!rows.length) {
    return description;
  }

  const attributesText = rows.map(([label, value]) => `${label}: ${value}`).join('\n');
  return [description, `Характеристики:\n${attributesText}`]
    .filter(Boolean)
    .join('\n\n');
}

function parseDescriptionAttributes(description: string) {
  const header = 'Характеристики:';
  const headerIndex = description.indexOf(header);

  if (headerIndex === -1) {
    return {
      description: description.trim(),
      attributes: {} as Record<string, string>,
    };
  }

  const baseDescription = description.slice(0, headerIndex).trim();
  const attributes = description
    .slice(headerIndex + header.length)
    .split(/\r?\n/)
    .reduce<Record<string, string>>((result, line) => {
      const separatorIndex = line.indexOf(':');

      if (separatorIndex <= 0) {
        return result;
      }

      const key = line.slice(0, separatorIndex).trim();
      const value = line.slice(separatorIndex + 1).trim();

      if (key && value) {
        result[key] = value;
      }

      return result;
    }, {});

  return {
    description: baseDescription,
    attributes,
  };
}

function sanitizeSheetName(value: string) {
  const cleaned = value.replace(/[\[\]:*?/\\]/g, ' ').trim();
  return (cleaned || 'Category').slice(0, 31);
}

function columnName(index: number) {
  let current = index;
  let name = '';

  while (current > 0) {
    const remainder = (current - 1) % 26;
    name = String.fromCharCode(65 + remainder) + name;
    current = Math.floor((current - 1) / 26);
  }

  return name;
}

function parseRows(sheetXml: string, sharedStrings: string[]) {
  return Array.from(
    sheetXml.matchAll(/<(?:\w+:)?row[^>]*>([\s\S]*?)<\/(?:\w+:)?row>/g),
  ).map((rowMatch) => {
    const cells: Record<string, string> = {};
    for (const cellMatch of rowMatch[1].matchAll(
      /<(?:\w+:)?c\b([^>]*)>([\s\S]*?)<\/(?:\w+:)?c>/g,
    )) {
      const attrs = cellMatch[1];
      const body = cellMatch[2];
      const ref = /r="([A-Z]+)\d+"/.exec(attrs)?.[1];
      if (!ref) {
        continue;
      }

      const type = /t="([^"]+)"/.exec(attrs)?.[1];
      const value =
        /<(?:\w+:)?v>([\s\S]*?)<\/(?:\w+:)?v>/.exec(body)?.[1] ?? '';

      if (type === 's') {
        cells[ref] = sharedStrings[Number(value)] ?? '';
      } else if (type === 'inlineStr') {
        cells[ref] = stripTags(
          body.replace(/<(?:\w+:)?t[^>]*>/g, '').replace(/<\/(?:\w+:)?t>/g, ''),
        );
      } else {
        cells[ref] = decodeXml(value);
      }
    }

    return cells;
  });
}

function parseSharedStrings(xmlFile?: Buffer) {
  if (!xmlFile) {
    return [];
  }

  const xml = xmlFile.toString('utf8');
  return Array.from(
    xml.matchAll(/<(?:\w+:)?si[^>]*>([\s\S]*?)<\/(?:\w+:)?si>/g),
  ).map((match) =>
    stripTags(
      match[1].replace(/<(?:\w+:)?t[^>]*>/g, '').replace(/<\/(?:\w+:)?t>/g, ''),
    ),
  );
}

function parseNumber(value: string | undefined) {
  const normalized = stringValue(value).replace(/\s/g, '').replace(',', '.');
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
}

function stringValue(value: string | undefined) {
  return value ?? '';
}

function stripTags(value: string) {
  return decodeXml(value.replace(/<[^>]+>/g, ''));
}

function inlineCell(cell: string, value: string, style = 0) {
  const styleAttr = style ? ` s="${style}"` : '';
  return `<c r="${cell}" t="inlineStr"${styleAttr}><is><t>${encodeXml(value)}</t></is></c>`;
}

function numberCell(cell: string, value: number, style = 0) {
  const styleAttr = style ? ` s="${style}"` : '';
  return `<c r="${cell}"${styleAttr}><v>${value}</v></c>`;
}

function text(value: string) {
  return Buffer.from(value, 'utf8');
}

function encodeXml(value: string | number) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function decodeXml(value: string) {
  return value
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&gt;/g, '>')
    .replace(/&lt;/g, '<')
    .replace(/&amp;/g, '&');
}

function readZip(buffer: Buffer) {
  const files = new Map<string, Buffer>();
  const endOffset = findEndOfCentralDirectory(buffer);

  if (endOffset < 0) {
    throw new Error('Формат Excel-файла не поддерживается');
  }

  const entries = buffer.readUInt16LE(endOffset + 10);
  const centralDirectoryOffset = buffer.readUInt32LE(endOffset + 16);
  let offset = centralDirectoryOffset;

  for (let index = 0; index < entries; index += 1) {
    if (buffer.readUInt32LE(offset) !== 0x02014b50) {
      throw new Error('Формат Excel-файла не поддерживается');
    }

    const compression = buffer.readUInt16LE(offset + 10);
    const compressedSize = buffer.readUInt32LE(offset + 20);
    const fileNameLength = buffer.readUInt16LE(offset + 28);
    const extraLength = buffer.readUInt16LE(offset + 30);
    const commentLength = buffer.readUInt16LE(offset + 32);
    const localHeaderOffset = buffer.readUInt32LE(offset + 42);
    const nameStart = offset + 46;
    const name = buffer
      .slice(nameStart, nameStart + fileNameLength)
      .toString('utf8');

    if (buffer.readUInt32LE(localHeaderOffset) !== 0x04034b50) {
      throw new Error('Формат Excel-файла не поддерживается');
    }

    const localFileNameLength = buffer.readUInt16LE(localHeaderOffset + 26);
    const localExtraLength = buffer.readUInt16LE(localHeaderOffset + 28);
    const dataStart =
      localHeaderOffset + 30 + localFileNameLength + localExtraLength;

    const compressed = buffer.slice(dataStart, dataStart + compressedSize);
    const data =
      compression === 0
        ? compressed
        : compression === 8
          ? inflateRawSync(compressed)
          : undefined;

    if (!data) {
      throw new Error('Формат Excel-файла не поддерживается');
    }

    files.set(name, data);
    offset = nameStart + fileNameLength + extraLength + commentLength;
  }

  return files;
}

function findEndOfCentralDirectory(buffer: Buffer) {
  for (let offset = buffer.length - 22; offset >= 0; offset -= 1) {
    if (buffer.readUInt32LE(offset) === 0x06054b50) {
      return offset;
    }
  }

  return -1;
}

function writeZip(files: Map<string, Buffer>) {
  const chunks: Buffer[] = [];
  const centralDirectory: Buffer[] = [];
  let offset = 0;

  for (const [fileName, data] of files.entries()) {
    const name = Buffer.from(fileName, 'utf8');
    const crc = crc32(data);
    const localHeader = Buffer.alloc(30);

    localHeader.writeUInt32LE(0x04034b50, 0);
    localHeader.writeUInt16LE(20, 4);
    localHeader.writeUInt16LE(0x0800, 6);
    localHeader.writeUInt16LE(0, 8);
    localHeader.writeUInt32LE(crc, 14);
    localHeader.writeUInt32LE(data.length, 18);
    localHeader.writeUInt32LE(data.length, 22);
    localHeader.writeUInt16LE(name.length, 26);

    chunks.push(localHeader, name, data);

    const centralHeader = Buffer.alloc(46);
    centralHeader.writeUInt32LE(0x02014b50, 0);
    centralHeader.writeUInt16LE(20, 4);
    centralHeader.writeUInt16LE(20, 6);
    centralHeader.writeUInt16LE(0x0800, 8);
    centralHeader.writeUInt32LE(crc, 16);
    centralHeader.writeUInt32LE(data.length, 20);
    centralHeader.writeUInt32LE(data.length, 24);
    centralHeader.writeUInt16LE(name.length, 28);
    centralHeader.writeUInt32LE(offset, 42);
    centralDirectory.push(centralHeader, name);

    offset += localHeader.length + name.length + data.length;
  }

  const centralSize = centralDirectory.reduce(
    (sum, chunk) => sum + chunk.length,
    0,
  );
  const end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50, 0);
  end.writeUInt16LE(files.size, 8);
  end.writeUInt16LE(files.size, 10);
  end.writeUInt32LE(centralSize, 12);
  end.writeUInt32LE(offset, 16);

  return Buffer.concat([...chunks, ...centralDirectory, end]);
}

const crcTable = Array.from({ length: 256 }, (_, index) => {
  let value = index;
  for (let bit = 0; bit < 8; bit += 1) {
    value = value & 1 ? 0xedb88320 ^ (value >>> 1) : value >>> 1;
  }
  return value >>> 0;
});

function crc32(data: Buffer) {
  let crc = 0xffffffff;
  for (const byte of data) {
    crc = (crc >>> 8) ^ crcTable[(crc ^ byte) & 0xff];
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function formulaStrCell(
  cell: string,
  formula: string,
  fallbackValue: string,
  style = 0,
) {
  const styleAttr = style ? ` s="${style}"` : '';
  // t="str" означает, что ячейка содержит формулу, возвращающую строку.
  // <f> - сама формула, <v> - кэшированное значение для парсера (до открытия файла в Excel).
  return `<c r="${cell}" t="str"${styleAttr}><f>${encodeXml(formula)}</f><v>${encodeXml(fallbackValue)}</v></c>`;
}

export function isTemplateStatus(value: string): value is ProductStatus {
  return productStatuses.includes(value as ProductStatus);
}

export function isTemplateAction(
  value: string,
): value is ProductTemplateAction {
  return productTemplateActions.includes(value as ProductTemplateAction);
}
