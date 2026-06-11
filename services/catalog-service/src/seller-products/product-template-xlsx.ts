import { inflateRawSync } from 'node:zlib';
import { productCategories } from './product-categories';
import { productStatuses, type ProductStatus } from './dto/create-product.dto';

export type ProductTemplateRow = {
  sku: string;
  name: string;
  description: string;
  category: string;
  price: number;
  oldPrice?: number;
  stock: number;
  status: ProductStatus;
  action?: ProductTemplateAction | '';
};

export const productTemplateActions = ['delete'] as const;
export type ProductTemplateAction = (typeof productTemplateActions)[number];

export function buildProductTemplateWorkbook(products: ProductTemplateRow[]) {
  const files = new Map<string, Buffer>();

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
  </sheets>
</workbook>`),
  );
  files.set(
    'xl/_rels/workbook.xml.rels',
    text(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/>
  <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet2.xml"/>
  <Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
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

  return writeZip(files);
}

export function parseProductWorkbook(buffer: Buffer) {
  const files = readZip(buffer);
  const sheet = files.get('xl/worksheets/sheet1.xml');

  if (!sheet) {
    throw new Error('В файле не найден лист Products');
  }

  const sharedStrings = parseSharedStrings(files.get('xl/sharedStrings.xml'));
  const rows = parseRows(sheet.toString('utf8'), sharedStrings);

  return rows.slice(1).flatMap((row, index) => {
    const rowNumber = index + 2;
    const sku = stringValue(row.A).trim();
    const name = stringValue(row.B).trim();
    const category = stringValue(row.C).trim();
    const price = parseNumber(row.D);
    const oldPrice = parseNumber(row.E);
    const stock = parseNumber(row.F);
    const status = stringValue(row.G).trim() || 'active';
    const description = stringValue(row.H).trim();
    const action = stringValue(row.I).trim().toLowerCase();

    if (!sku && !name && !category && price === 0 && stock === 0 && !action) {
      return [];
    }

    return [
      {
        rowNumber,
        sku,
        name,
        category,
        price,
        oldPrice: oldPrice === 0 ? undefined : oldPrice,
        stock,
        status,
        description,
        action,
      },
    ];
  });
}

function buildProductsSheet(products: ProductTemplateRow[]) {
  const headers = [
    'SKU',
    'Название',
    'Категория',
    'Цена',
    'Старая цена',
    'Остаток',
    'Статус',
    'Описание',
  ];
  headers.push('Action');

  const headerCells = headers
    .map((header, index) =>
      inlineCell(`${String.fromCharCode(65 + index)}1`, header, 1),
    )
    .join('');
  const rows = products
    .map((product, index) => {
      const row = index + 2;
      return `<row r="${row}">${[
        inlineCell(`A${row}`, product.sku, 2),
        inlineCell(`B${row}`, product.name, 2),
        inlineCell(`C${row}`, product.category, 2),
        numberCell(`D${row}`, product.price, 2),
        product.oldPrice ? numberCell(`E${row}`, product.oldPrice, 2) : inlineCell(`E${row}`, '', 2),
        numberCell(`F${row}`, product.stock, 2),
formulaStrCell(`G${row}`, `IF(F${row}=0,"draft","active")`, product.status, 2),
        inlineCell(`H${row}`, product.description, 2),
        inlineCell(`I${row}`, product.action ?? '', 2),
      ].join('')}</row>`;
    })
    .join('');

  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <dimension ref="A1:I500"/>
  <sheetViews><sheetView workbookViewId="0"><pane ySplit="1" topLeftCell="A2" activePane="bottomLeft" state="frozen"/></sheetView></sheetViews>
  <cols><col min="1" max="1" width="18" customWidth="1"/><col min="2" max="2" width="32" customWidth="1"/><col min="3" max="3" width="26" customWidth="1"/><col min="4" max="5" width="14" customWidth="1"/><col min="6" max="6" width="14" customWidth="1"/><col min="7" max="7" width="14" customWidth="1"/><col min="8" max="8" width="44" customWidth="1"/><col min="9" max="9" width="16" customWidth="1"/></cols>
  <sheetData><row r="1">${headerCells}</row>${rows}</sheetData>
  <dataValidations count="6">
    <dataValidation type="list" allowBlank="0" showErrorMessage="1" sqref="C2:C500"><formula1>Categories!$A$2:$A$16</formula1></dataValidation>
    <dataValidation type="whole" operator="greaterThanOrEqual" allowBlank="0" showErrorMessage="1" sqref="D2:D500"><formula1>1</formula1></dataValidation>
    <dataValidation type="whole" operator="greaterThanOrEqual" allowBlank="1" showErrorMessage="1" sqref="E2:E500"><formula1>1</formula1></dataValidation>
    <dataValidation type="whole" operator="greaterThanOrEqual" allowBlank="0" showErrorMessage="1" sqref="F2:F500"><formula1>0</formula1></dataValidation>
    <dataValidation type="list" allowBlank="0" showErrorMessage="1" sqref="G2:G500"><formula1>"active,draft,archived"</formula1></dataValidation>
    <dataValidation type="list" allowBlank="1" showErrorMessage="1" sqref="I2:I500"><formula1>"delete"</formula1></dataValidation>
  </dataValidations>
</worksheet>`;
}

function buildCategoriesSheet() {
  const rows = [
    `<row r="1">${inlineCell('A1', 'Категория', 1)}${inlineCell('B1', 'Используйте одно из этих значений в колонке Категория', 1)}</row>`,
    ...productCategories.map((category, index) => {
      const row = index + 2;
      return `<row r="${row}">${inlineCell(`A${row}`, category, 2)}</row>`;
    }),
  ].join('');

  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <dimension ref="A1:B${productCategories.length + 1}"/>
  <sheetViews><sheetView workbookViewId="0"/></sheetViews>
  <cols><col min="1" max="1" width="30" customWidth="1"/><col min="2" max="2" width="58" customWidth="1"/></cols>
  <sheetData>${rows}</sheetData>
</worksheet>`;
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

function formulaStrCell(cell: string, formula: string, fallbackValue: string, style = 0) {
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
