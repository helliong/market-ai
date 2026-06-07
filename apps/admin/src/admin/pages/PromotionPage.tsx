import { Megaphone, Sparkles } from "lucide-react";

export function PromotionPage() {
  return (
    <section className="promotion-page" aria-label="Продвижение">
      <div className="promotion-card">
        <span className="promotion-card-icon">
          <Megaphone aria-hidden="true" />
        </span>
        <p className="promotion-eyebrow">Скоро</p>
        <h2>Продвижение в разработке</h2>
        <p>
          Здесь появятся инструменты для поднятия товаров в выдаче, настройки
          промо-кампаний и управления приоритетными позициями.
        </p>
        <div className="promotion-note">
          <Sparkles aria-hidden="true" />
          <span>Мы готовим этот раздел, чтобы продавцу было проще управлять ростом продаж.</span>
        </div>
      </div>
    </section>
  );
}
