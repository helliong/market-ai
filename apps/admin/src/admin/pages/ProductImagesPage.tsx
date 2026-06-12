import { useMemo, useState } from "react";
import { ImagePlus, Upload } from "lucide-react";
import type { Product, ProductImage } from "../types";

type ProductImagesPageProps = {
  products: Product[];
  onEditProduct: (product: Product) => void;
};

type ImageRow = {
  product: Product;
  image: ProductImage | null;
};

export function ProductImagesPage({ products, onEditProduct }: ProductImagesPageProps) {
  const [query, setQuery] = useState("");
  const [imageStatus, setImageStatus] = useState<"" | "withImages" | "withoutImages">("");
  const rows = useMemo(
    () =>
      products.reduce<ImageRow[]>((items, product) => {
        if (!product.images.length) {
          items.push({ product, image: null });
          return items;
        }

        product.images.forEach((image) => {
          items.push({ product, image });
        });

        return items;
      }, []),
    [products],
  );
  const filteredRows = useMemo(
    () => filterImageRows(rows, query, imageStatus),
    [imageStatus, query, rows],
  );
  const hasActiveFilters = Boolean(query || imageStatus);

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
          <span>{`Найдено ${filteredRows.length} из ${rows.length}`}</span>
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
              <th>Тип фото</th>
              <th>Статус</th>
              <th>Ошибка</th>
              <th>Действия</th>
            </tr>
          </thead>
          <tbody>
            {filteredRows.map(({ product, image }) => (
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
                <td>{image?.isMain ? "Главное фото" : image ? "Дополнительное фото" : "—"}</td>
                <td>
                  <span className="status-badge">
                    {image ? "Привязано к товару" : "Ожидает загрузки"}
                  </span>
                </td>
                <td>{image ? "—" : "Фото не загружено"}</td>
                <td>
                  <button className="table-button" onClick={() => onEditProduct(product)}>
                    Изменить
                  </button>
                </td>
              </tr>
            ))}

            {filteredRows.length === 0 && (
              <tr>
                <td colSpan={8} className="empty-cell">
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

function filterImageRows(rows: ImageRow[], query: string, imageStatus: "" | "withImages" | "withoutImages") {
  const normalizedQuery = normalizeSearch(query);

  return rows.filter(({ product, image }) => {
    if (imageStatus === "withImages" && !image) {
      return false;
    }

    if (imageStatus === "withoutImages" && image) {
      return false;
    }

    if (
      normalizedQuery &&
      ![product.sku, product.name, product.category, image ? getFileName(image) : ""]
        .map(normalizeSearch)
        .some((value) => value.includes(normalizedQuery))
    ) {
      return false;
    }

    return true;
  });
}

function getFileName(image: ProductImage) {
  try {
    return new URL(image.url).pathname.split("/").filter(Boolean).at(-1) ?? image.url;
  } catch {
    return image.url.split("/").filter(Boolean).at(-1) ?? image.url;
  }
}

function normalizeSearch(value: string) {
  return value.trim().toLowerCase();
}
