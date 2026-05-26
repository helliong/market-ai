import { SellerAuthFooter } from "../register/SellerAuthFooter";
import "../register/SellerRegisterPage.css";

const sections = [
  {
    title: "1. Общие условия",
    text: "Соглашение описывает базовые правила использования кабинета продавца MarketAI, включая настройку витрины, управление товарами и обработку заказов.",
  },
  {
    title: "2. Аккаунт продавца",
    text: "Продавец отвечает за актуальность данных аккаунта, информации о магазине, описаний товаров, цен и сведений по обработке заказов.",
  },
  {
    title: "3. Информация о товарах",
    text: "Карточки товаров должны содержать корректные названия, категории, цены, остатки и статусы. Демоданные можно заменить после подключения backend-сервисов.",
  },
  {
    title: "4. Инструменты администрирования",
    text: "Панель предоставляет интерфейсные инструменты для операций маркетплейса. Бизнес-правила, модерация, платежи и доставка могут быть расширены позже.",
  },
  {
    title: "5. Обновления",
    text: "MarketAI может обновлять условия по мере развития продукта продавца, добавления backend-сервисов и новых операционных функций.",
  },
];

export function SellerAgreementPage() {
  return (
    <main className="seller-agreement-page">
      <div className="seller-register-brand">
        <a className="seller-register-logo" href="/">
          <span className="seller-logo-word">
            Market<span>AI</span>
          </span>
          <small>Продавцам</small>
        </a>
      </div>

      <section className="seller-agreement-shell">
        <div className="seller-agreement-card">
          <p className="seller-register-eyebrow">Продавцы MarketAI</p>
          <h1>Пользовательское соглашение</h1>
          <p>
            Условия для продавцов, использующих панель MarketAI. Это
            frontend-версия соглашения, которую можно расширить правилами
            backend позже.
          </p>

          <div className="seller-agreement-sections">
            {sections.map((section) => (
              <section key={section.title}>
                <h2>{section.title}</h2>
                <p>{section.text}</p>
              </section>
            ))}
          </div>
        </div>
      </section>

      <SellerAuthFooter />
    </main>
  );
}
