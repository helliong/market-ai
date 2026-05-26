import {
  ArrowRight,
  BarChart3,
  Boxes,
  ClipboardCheck,
  Store,
} from "lucide-react";
import { SellerAuthFooter } from "../register/SellerAuthFooter";
import "../register/SellerRegisterPage.css";
import "./SellerWelcomePage.css";

const highlights = [
  {
    title: "Витрина под контролем",
    text: "Настраивайте товары, статусы и остатки в одном рабочем пространстве.",
    icon: <Store aria-hidden="true" />,
  },
  {
    title: "Заказы без суеты",
    text: "Следите за заявками, меняйте статусы и держите операционку рядом.",
    icon: <ClipboardCheck aria-hidden="true" />,
  },
  {
    title: "Пульс магазина",
    text: "Смотрите выручку, активность и ключевые показатели без лишнего шума.",
    icon: <BarChart3 aria-hidden="true" />,
  },
];

export function SellerWelcomePage() {
  return (
    <main className="seller-welcome-page">
      <header className="seller-welcome-header">
        <a className="seller-register-logo" href="/">
          <span className="seller-logo-word">
            Market<span>AI</span>
          </span>
          <small>Продавцам</small>
        </a>

        <nav className="seller-welcome-nav" aria-label="Навигация продавца">
          <a className="seller-welcome-nav-secondary" href="/login">
            Вход
          </a>
          <a className="seller-welcome-nav-primary" href="/register">
            Стать продавцом
          </a>
        </nav>
      </header>

      <section className="seller-welcome-hero">
        <div className="seller-welcome-copy">
          <p className="seller-register-eyebrow">Кабинет продавца MarketAI</p>
          <h1>Запускайте продажи и управляйте магазином в одном месте</h1>
          <p>
            Пространство для продавцов: каталог, заказы, пользователи и быстрый
            обзор состояния магазина без переходов между разными инструментами.
          </p>

          <div className="seller-welcome-actions">
            <a className="seller-welcome-primary-button" href="/register">
              Создать магазин
              <ArrowRight size={18} aria-hidden="true" />
            </a>
            <a className="seller-welcome-secondary-button" href="/login">
              Войти в кабинет
            </a>
          </div>
        </div>

        <div className="seller-welcome-panel" aria-label="Обзор возможностей">
          <div className="seller-welcome-panel-header">
            <span>
              <Boxes aria-hidden="true" />
            </span>
            <div>
              <p>MarketAI Store</p>
              <h2>Рабочая панель</h2>
            </div>
          </div>

          <div className="seller-welcome-metrics">
            <div>
              <span>Товары</span>
              <strong>128</strong>
            </div>
            <div>
              <span>Заказы</span>
              <strong>34</strong>
            </div>
            <div>
              <span>Выручка</span>
              <strong>₽842k</strong>
            </div>
          </div>

          <div className="seller-welcome-status-list">
            <span>12 заказов в обработке</span>
            <span>8 товаров требуют обновления остатков</span>
            <span>4 карточки готовы к публикации</span>
          </div>
        </div>
      </section>

      <section className="seller-welcome-highlights">
        {highlights.map((item) => (
          <article key={item.title}>
            <span>{item.icon}</span>
            <h2>{item.title}</h2>
            <p>{item.text}</p>
          </article>
        ))}
      </section>

      <SellerAuthFooter />
    </main>
  );
}
