import { ImagePlus, Upload } from "lucide-react";
import type { Product, ProductImage } from "../types";

type ProductImagesPageProps = {
  products: Product[];
  onEditProduct: (product: Product) => void;
};

export function ProductImagesPage({ products, onEditProduct }: ProductImagesPageProps) {
  const rows = products.reduce<Array<{ product: Product; image: ProductImage | null }>>(
    (items, product) => {
      if (!product.images.length) {
        items.push({ product, image: null });
        return items;
      }

      product.images.forEach((image) => {
        items.push({ product, image });
      });

      return items;
    },
    [],
  );

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
            {rows.map(({ product, image }) => (
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

            {rows.length === 0 && (
              <tr>
                <td colSpan={8} className="empty-cell">
                  Товары пока не добавлены
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function getFileName(image: ProductImage) {
  try {
    return new URL(image.url).pathname.split("/").filter(Boolean).at(-1) ?? image.url;
  } catch {
    return image.url.split("/").filter(Boolean).at(-1) ?? image.url;
  }
}
