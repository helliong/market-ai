const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const targetDir = path.join(root, "apps", "admin", "public", "templates");
const targetFile = path.join(targetDir, "product-bulk-template.xlsx");
const tmp = path.join(root, ".tmp", `product-template-xlsx-${process.pid}`);

const categories = [
  "Смартфоны",
  "Ноутбуки",
  "Планшеты",
  "Наушники",
  "Аудиотехника",
  "Компьютеры и периферия",
  "Мониторы",
  "Умный дом",
  "ТВ и видеотехника",
  "Аксессуары",
  "Одежда",
  "Обувь",
  "Спорт",
  "Дом и быт",
  "Красота и здоровье",
];

function ensureDir(filePath) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
}

function write(filePath, contents) {
  ensureDir(filePath);
  fs.writeFileSync(filePath, contents, "utf8");
}

function xml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function inlineCell(cell, value, style = 0) {
  const styleAttr = style ? ` s="${style}"` : "";
  return `<c r="${cell}" t="inlineStr"${styleAttr}><is><t>${xml(value)}</t></is></c>`;
}

function numberCell(cell, value, style = 0) {
  const styleAttr = style ? ` s="${style}"` : "";
  return `<c r="${cell}"${styleAttr}><v>${value}</v></c>`;
}

fs.mkdirSync(targetDir, { recursive: true });

write(
  path.join(tmp, "[Content_Types].xml"),
  `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/docProps/app.xml" ContentType="application/vnd.openxmlformats-officedocument.extended-properties+xml"/>
  <Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/>
  <Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>
  <Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>
  <Override PartName="/xl/worksheets/sheet2.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>
  <Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>
</Types>`
);

write(
  path.join(tmp, "_rels", ".rels"),
  `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>
  <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/>
  <Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/extended-properties" Target="docProps/app.xml"/>
</Relationships>`
);

write(
  path.join(tmp, "docProps", "app.xml"),
  `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Properties xmlns="http://schemas.openxmlformats.org/officeDocument/2006/extended-properties">
  <Application>MarketAI</Application>
</Properties>`
);

write(
  path.join(tmp, "docProps", "core.xml"),
  `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:dcterms="http://purl.org/dc/terms/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
  <dc:title>MarketAI product import template</dc:title>
  <dc:creator>MarketAI</dc:creator>
  <dcterms:created xsi:type="dcterms:W3CDTF">2026-06-04T00:00:00Z</dcterms:created>
  <dcterms:modified xsi:type="dcterms:W3CDTF">2026-06-04T00:00:00Z</dcterms:modified>
</cp:coreProperties>`
);

write(
  path.join(tmp, "xl", "workbook.xml"),
  `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <sheets>
    <sheet name="Products" sheetId="1" r:id="rId1"/>
    <sheet name="Categories" sheetId="2" r:id="rId2"/>
  </sheets>
</workbook>`
);

write(
  path.join(tmp, "xl", "_rels", "workbook.xml.rels"),
  `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/>
  <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet2.xml"/>
  <Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
</Relationships>`
);

write(
  path.join(tmp, "xl", "styles.xml"),
  `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <fonts count="2"><font><sz val="11"/><name val="Calibri"/></font><font><b/><sz val="11"/><color rgb="FFFFFFFF"/><name val="Calibri"/></font></fonts>
  <fills count="3"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill><fill><patternFill patternType="solid"><fgColor rgb="FF2563EB"/></patternFill></fill></fills>
  <borders count="2"><border><left/><right/><top/><bottom/><diagonal/></border><border><left style="thin"/><right style="thin"/><top style="thin"/><bottom style="thin"/><diagonal/></border></borders>
  <cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>
  <cellXfs count="3"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/><xf numFmtId="0" fontId="1" fillId="2" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1"/><xf numFmtId="0" fontId="0" fillId="0" borderId="1" xfId="0" applyBorder="1"/></cellXfs>
  <cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles>
</styleSheet>`
);

const headers = ["SKU", "Название", "Категория", "Цена", "Остаток", "Статус", "Описание"];
const headerCells = headers
  .map((header, index) => inlineCell(`${String.fromCharCode(65 + index)}1`, header, 1))
  .join("");
const sampleCells = [
  inlineCell("A2", "SKU-001", 2),
  inlineCell("B2", "iPhone 15 128GB", 2),
  inlineCell("C2", "Смартфоны", 2),
  numberCell("D2", 129990, 2),
  numberCell("E2", 12, 2),
  inlineCell("F2", "active", 2),
  inlineCell("G2", "Короткое описание товара", 2),
].join("");

write(
  path.join(tmp, "xl", "worksheets", "sheet1.xml"),
  `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <dimension ref="A1:G500"/>
  <sheetViews><sheetView workbookViewId="0"><pane ySplit="1" topLeftCell="A2" activePane="bottomLeft" state="frozen"/></sheetView></sheetViews>
  <cols><col min="1" max="1" width="18" customWidth="1"/><col min="2" max="2" width="32" customWidth="1"/><col min="3" max="3" width="26" customWidth="1"/><col min="4" max="5" width="14" customWidth="1"/><col min="6" max="6" width="14" customWidth="1"/><col min="7" max="7" width="38" customWidth="1"/></cols>
  <sheetData><row r="1">${headerCells}</row><row r="2">${sampleCells}</row></sheetData>
  <dataValidations count="4">
    <dataValidation type="list" allowBlank="0" showErrorMessage="1" sqref="C2:C500"><formula1>Categories!$A$2:$A$16</formula1></dataValidation>
    <dataValidation type="whole" operator="greaterThanOrEqual" allowBlank="0" showErrorMessage="1" sqref="D2:D500"><formula1>1</formula1></dataValidation>
    <dataValidation type="whole" operator="greaterThanOrEqual" allowBlank="0" showErrorMessage="1" sqref="E2:E500"><formula1>0</formula1></dataValidation>
    <dataValidation type="list" allowBlank="0" showErrorMessage="1" sqref="F2:F500"><formula1>"active,draft,archived"</formula1></dataValidation>
  </dataValidations>
</worksheet>`
);

const categoryRows = [
  `<row r="1">${inlineCell("A1", "Категория", 1)}${inlineCell("B1", "Используйте одно из этих значений в колонке Категория", 1)}</row>`,
  ...categories.map((category, index) => {
    const row = index + 2;
    return `<row r="${row}">${inlineCell(`A${row}`, category, 2)}</row>`;
  }),
].join("\n");

write(
  path.join(tmp, "xl", "worksheets", "sheet2.xml"),
  `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <dimension ref="A1:B${categories.length + 1}"/>
  <sheetViews><sheetView workbookViewId="0"/></sheetViews>
  <cols><col min="1" max="1" width="30" customWidth="1"/><col min="2" max="2" width="58" customWidth="1"/></cols>
  <sheetData>${categoryRows}</sheetData>
</worksheet>`
);

function collectFiles(directory, base = directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      return collectFiles(fullPath, base);
    }

    return {
      name: path.relative(base, fullPath).replace(/\\/g, "/"),
      data: fs.readFileSync(fullPath),
    };
  });
}

function writeZip(filePath, entries) {
  const chunks = [];
  const centralDirectory = [];
  let offset = 0;

  for (const entry of entries) {
    const name = Buffer.from(entry.name, "utf8");
    const data = entry.data;
    const crc = crc32(data);
    const localHeader = Buffer.alloc(30);

    localHeader.writeUInt32LE(0x04034b50, 0);
    localHeader.writeUInt16LE(20, 4);
    localHeader.writeUInt16LE(0x0800, 6);
    localHeader.writeUInt16LE(0, 8);
    localHeader.writeUInt16LE(0, 10);
    localHeader.writeUInt16LE(0, 12);
    localHeader.writeUInt32LE(crc, 14);
    localHeader.writeUInt32LE(data.length, 18);
    localHeader.writeUInt32LE(data.length, 22);
    localHeader.writeUInt16LE(name.length, 26);
    localHeader.writeUInt16LE(0, 28);

    chunks.push(localHeader, name, data);

    const centralHeader = Buffer.alloc(46);
    centralHeader.writeUInt32LE(0x02014b50, 0);
    centralHeader.writeUInt16LE(20, 4);
    centralHeader.writeUInt16LE(20, 6);
    centralHeader.writeUInt16LE(0x0800, 8);
    centralHeader.writeUInt16LE(0, 10);
    centralHeader.writeUInt16LE(0, 12);
    centralHeader.writeUInt16LE(0, 14);
    centralHeader.writeUInt32LE(crc, 16);
    centralHeader.writeUInt32LE(data.length, 20);
    centralHeader.writeUInt32LE(data.length, 24);
    centralHeader.writeUInt16LE(name.length, 28);
    centralHeader.writeUInt16LE(0, 30);
    centralHeader.writeUInt16LE(0, 32);
    centralHeader.writeUInt16LE(0, 34);
    centralHeader.writeUInt16LE(0, 36);
    centralHeader.writeUInt32LE(0, 38);
    centralHeader.writeUInt32LE(offset, 42);
    centralDirectory.push(centralHeader, name);

    offset += localHeader.length + name.length + data.length;
  }

  const centralSize = centralDirectory.reduce((sum, chunk) => sum + chunk.length, 0);
  const end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50, 0);
  end.writeUInt16LE(0, 4);
  end.writeUInt16LE(0, 6);
  end.writeUInt16LE(entries.length, 8);
  end.writeUInt16LE(entries.length, 10);
  end.writeUInt32LE(centralSize, 12);
  end.writeUInt32LE(offset, 16);
  end.writeUInt16LE(0, 20);

  fs.writeFileSync(filePath, Buffer.concat([...chunks, ...centralDirectory, end]));
}

function crc32(data) {
  let crc = 0xffffffff;
  for (const byte of data) {
    crc = (crc >>> 8) ^ crcTable[(crc ^ byte) & 0xff];
  }
  return (crc ^ 0xffffffff) >>> 0;
}

const crcTable = Array.from({ length: 256 }, (_, index) => {
  let value = index;
  for (let bit = 0; bit < 8; bit += 1) {
    value = value & 1 ? 0xedb88320 ^ (value >>> 1) : value >>> 1;
  }
  return value >>> 0;
});

writeZip(targetFile, collectFiles(tmp));
console.log(`Created ${targetFile}`);
