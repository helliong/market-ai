import { SellerAuthFooter } from "../register/SellerAuthFooter";
import { useLanguage } from "../hooks/useLanguage";
import "../register/SellerRegisterPage.css";

const sections = [
  "sectionGeneral",
  "sectionAccount",
  "sectionProducts",
  "sectionAdmin",
  "sectionUpdates",
];

export function SellerAgreementPage() {
  const { t } = useLanguage();

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
          <p className="seller-register-eyebrow">{t("sellersMarketAI")}</p>
          <h1>{t("agreementTitle")}</h1>
          <p>{t("agreementDesc")}</p>

          <div className="seller-agreement-sections">
            {sections.map((key) => (
              <section key={key}>
                <h2>{t(key)}</h2>
                <p>{t(`${key}Text`)}</p>
              </section>
            ))}
          </div>
        </div>
      </section>

      <SellerAuthFooter />
    </main>
  );
}