import { useMemo, useState } from "react";
import { ChevronDown, ChevronRight, ImagePlus, Upload } from "lucide-react";
import type { Product, ProductImage } from "../types";

type ProductImagesPageProps = {
  products: Product[];
  onEditProduct: (product: Product) => void;
};

type ImageRow = {
  product: Product;
  image: ProductImage | null;
  isAdditional: boolean;
};

export function ProductImagesPage({ products, onEditProduct }: ProductImagesPageProps) {
  const [query, setQuery] = useState("");
  const [imageStatus, setImageStatus] = useState<"" | "withImages" | "withoutImages">("");
  const [expandedProductIds, setExpandedProductIds] = useState<Set<number>>(
    () => new Set(),
  );
  const filteredProducts = useMemo(
    () => filterImageProducts(products, query, imageStatus),
    [imageStatus, products, query],
  );
  const visibleRows = useMemo(
    () =>
      filteredProducts.flatMap((product) =>
        buildVisibleImageRows(product, expandedProductIds.has(product.id)),
      ),
    [expandedProductIds, filteredProducts],
  );
  const hasActiveFilters = Boolean(query || imageStatus);

  function toggleProductImages(productId: number) {
    setExpandedProductIds((current) => {
      const next = new Set(current);

      if (next.has(productId)) {
        next.delete(productId);
      } else {
        next.add(productId);
      }

      return next;
    });
  }

  return (
    <section className="panel">
      <div className="section-header">
        <div>
          <h2>Загрузка изображений</h2>
          <p>Загружайте фотографии товаров и привязывайте их к карточкам по SKU.</p>
        </div>
        <div className="section-actions">
          <button type="button" className="secondary-button" disabled>
            <Upload aria-hidden="true" />
            Загрузить изображения
          </button>
        </div>
      </div>

      <div className="image-upload-info">
        <div>
          <ImagePlus aria-hidden="true" />
        </div>
        <div>
          <h3>Правила именования файлов</h3>
          <p>Используйте SKU товара в названии файла: STYLEUP-NK-001-main.jpg, STYLEUP-NK-001-2.jpg.</p>
        </div>
      </div>

      <div className="product-filters" aria-label="Фильтры изображений">
        <label>
          Товар, SKU или файл
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="SKU, название или файл"
          />
        </label>
        <label>
          Статус фото
          <select
            value={imageStatus}
            onChange={(event) => setImageStatus(event.target.value as typeof imageStatus)}
          >
            <option value="">Все статусы</option>
            <option value="withImages">С фото</option>
            <option value="withoutImages">Без фото</option>
          </select>
        </label>
        <div className="product-filter-summary">
          <span>{`Найдено ${filteredProducts.length} из ${products.length}`}</span>
          <button
            type="button"
            className="table-button"
            disabled={!hasActiveFilters}
            onClick={() => {
              setQuery("");
              setImageStatus("");
            }}
          >
            Сбросить
          </button>
        </div>
      </div>

      <div className="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>Превью</th>
              <th>Название файла</th>
              <th>SKU</th>
              <th>Товар</th>
              <th>Цвет</th>
              <th>Тип фото</th>
              <th>Статус</th>
              <th>Ошибка</th>
              <th>Действия</th>
            </tr>
          </thead>
          <tbody>
            {visibleRows.map(({ product, image, isAdditional }) => {
              const additionalImagesCount = getAdditionalImages(product).length;
              const isExpanded = expandedProductIds.has(product.id);
              const productColor = getProductColor(product);

              return (
                <tr key={`${product.id}-${image?.id ?? "empty"}`}>
                  <td>
                    {image ? (
                      <img className="product-thumbnail" src={image.url} alt="" loading="lazy" />
                    ) : (
                      <span className="product-thumbnail-placeholder" aria-label="Нет фото" />
                    )}
                  </td>
                  <td>{image ? getFileName(image) : "—"}</td>
                  <td>{product.sku}</td>
                  <td>{product.name}</td>
                  <td>{productColor || "—"}</td>
                  <td>{image?.isMain ? "Главное фото" : image ? "Дополнительное фото" : "—"}</td>
                  <td>
                    <span className="status-badge">
                      {image ? "Привязано к товару" : "Ожидает загрузки"}
                    </span>
                  </td>
                  <td>{image ? "—" : "Фото не загружено"}</td>
                  <td>
                    {!isAdditional && (
                      <div className="table-actions">
                        {additionalImagesCount > 0 && (
                          <button
                            className="table-button"
                            type="button"
                            onClick={() => toggleProductImages(product.id)}
                          >
                            {isExpanded ? (
                              <ChevronDown aria-hidden="true" />
                            ) : (
                              <ChevronRight aria-hidden="true" />
                            )}
                            {isExpanded ? "Скрыть доп." : `Доп. фото (${additionalImagesCount})`}
                          </button>
                        )}
                        <button className="table-button" onClick={() => onEditProduct(product)}>
                          Изменить
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}

            {visibleRows.length === 0 && (
              <tr>
                <td colSpan={9} className="empty-cell">
                  {products.length === 0 ? "Товары пока не добавлены" : "Товары не найдены"}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function buildVisibleImageRows(product: Product, isExpanded: boolean): ImageRow[] {
  const mainImage = getMainImage(product);
  const rows: ImageRow[] = [{ product, image: mainImage, isAdditional: false }];

  if (isExpanded) {
    rows.push(
      ...getAdditionalImages(product).map((image) => ({
        product,
        image,
        isAdditional: true,
      })),
    );
  }

  return rows;
}

function filterImageProducts(
  products: Product[],
  query: string,
  imageStatus: "" | "withImages" | "withoutImages",
) {
  const normalizedQuery = normalizeSearch(query);

  return products.filter((product) => {
    if (imageStatus === "withImages" && product.images.length === 0) {
      return false;
    }

    if (imageStatus === "withoutImages" && product.images.length > 0) {
      return false;
    }

    if (
      normalizedQuery &&
      ![
        product.sku,
        product.name,
        product.category,
        ...product.images.map(getFileName),
      ]
        .map(normalizeSearch)
        .some((value) => value.includes(normalizedQuery))
    ) {
      return false;
    }

    return true;
  });
}

function getMainImage(product: Product) {
  const images = [...product.images].sort((left, right) => left.sortOrder - right.sortOrder);
  return images.find((image) => image.isMain) ?? images[0] ?? null;
}

function getAdditionalImages(product: Product) {
  const mainImage = getMainImage(product);

  return [...product.images]
    .filter((image) => image.id !== mainImage?.id)
    .sort((left, right) => left.sortOrder - right.sortOrder);
}

function getFileName(image: ProductImage) {
  try {
    return new URL(image.url).pathname.split("/").filter(Boolean).at(-1) ?? image.url;
  } catch {
    return image.url.split("/").filter(Boolean).at(-1) ?? image.url;
  }
}

function getProductColor(product: Product) {
  const attributes = product.attributes ?? {};
  const descriptionAttributes = getProductDescriptionAttributes(product.description);

  return attributes["Цвет"] ?? attributes.color ?? descriptionAttributes["Цвет"] ?? "";
}

function getProductDescriptionAttributes(description: string) {
  const attributes: Record<string, string> = {};

  for (const line of description.split(/\r?\n/)) {
    const separatorIndex = line.indexOf(":");

    if (separatorIndex <= 0) {
      continue;
    }

    const key = line.slice(0, separatorIndex).trim();
    const value = line.slice(separatorIndex + 1).trim();

    if (key && value) {
      attributes[key] = value;
    }
  }

  return attributes;
}

function normalizeSearch(value: string) {
  return value.trim().toLowerCase();
}
