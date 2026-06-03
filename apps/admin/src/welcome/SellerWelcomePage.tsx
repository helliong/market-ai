import { ArrowRight, BarChart3, Boxes, ClipboardCheck, Store } from "lucide-react";
import { SellerAuthFooter } from "../register/SellerAuthFooter";
import { useLanguage } from "../hooks/useLanguage";
import "../register/SellerRegisterPage.css";
import "./SellerWelcomePage.css";

const highlights = [
  {
    key: "highlightStoreControl",
    textKey: "highlightStoreText",
    icon: <Store aria-hidden="true" />,
  },
  { key: "highlightOrders", icon: <ClipboardCheck aria-hidden="true" /> },
  { key: "highlightPulse", icon: <BarChart3 aria-hidden="true" /> },
];

// Приветственная страница продавца с переходами к регистрации и входу.
export function SellerWelcomePage() {
  const { t } = useLanguage();

  return (
    <main className="seller-welcome-page">
      <header className="seller-welcome-header">
        <a className="seller-register-logo" href="/">
          <span className="seller-logo-word">
            Market<span>AI</span>
          </span>
          <small>{t("forSellers")}</small>
        </a>
        <nav className="seller-welcome-nav" aria-label={t("sellerNavigation")}>
          <a className="seller-welcome-nav-secondary" href="/agreement">
            {t("agreementTitle")}
          </a>
          <a className="seller-welcome-nav-secondary" href="/login">{t("loginButton")}</a>
          <a className="seller-welcome-nav-primary" href="/register">{t("createStore")}</a>
        </nav>
      </header>

      <section className="seller-welcome-hero">
        <div className="seller-welcome-copy">
          <p className="seller-register-eyebrow">{t("sellerCabinet")}</p>
          <h1>{t("welcomeTitle")}</h1>
          <p>{t("welcomeDesc")}</p>
          <div className="seller-welcome-actions">
            <a className="seller-welcome-primary-button" href="/register">
              {t("createStore")}
              <ArrowRight size={18} aria-hidden="true" />
            </a>
            <a className="seller-welcome-secondary-button" href="/login">{t("loginCabinet")}</a>
          </div>
        </div>

        <div className="seller-welcome-panel" aria-label={t("sellerCabinet")}>
          <div className="seller-welcome-panel-header">
            <span><Boxes aria-hidden="true" /></span>
            <div>
              <p>MarketAI Store</p>
              <h2>{t("workplace")}</h2>
            </div>
          </div>
          <div className="seller-welcome-metrics">
            <div>
              <span>{t("products")}</span>
              <strong>128</strong>
            </div>
            <div>
              <span>{t("orders")}</span>
              <strong>34</strong>
            </div>
            <div>
              <span>{t("revenue")}</span>
              <strong>₽842k</strong>
            </div>
          </div>
          <div className="seller-welcome-status-list">
            <span>12 {t("statusOrdersProcessing")}</span>
            <span>8 {t("statusStockUpdate")}</span>
            <span>4 {t("statusReadyToPublish")}</span>
          </div>
        </div>
      </section>

      <section className="seller-welcome-highlights">
        {highlights.map((item) => (
          <article key={item.key}>
            <span>{item.icon}</span>
            <h2>{t(item.key)}</h2>
            <p>{t(item.textKey ?? `${item.key}Text`)}</p>
          </article>
        ))}
      </section>

      <SellerAuthFooter />
    </main>
  );
}
