import { Heart, Languages, Mail, MapPin, Moon, Phone, Sun } from "lucide-react";
import { useLanguage } from "../hooks/useLanguage";
import { setTheme, useTheme } from "../settings-store";

const footerLinks = [
  { href: "/dashboard", labelKey: "dashboard" },
  { href: "/register", labelKey: "createStore" },
  { href: "/login", labelKey: "loginButton" },
  { href: "/agreement", labelKey: "agreementTitle" },
];

// Общий footer auth-страниц продавца с навигацией, контактами, темой и языком.
export function SellerAuthFooter() {
  const { t, lang, changeLanguage } = useLanguage();
  const theme = useTheme();

  return (
    <footer className="seller-auth-footer">
      <div className="seller-auth-footer-main">
        <div>
          <a className="seller-auth-footer-logo" href="/">
            <img
              className="seller-auth-footer-logo-image"
              src="/logo.webp"
              alt=""
              aria-hidden="true"
            />
            <span className="seller-logo-word">
              Market<span>AI</span>
            </span>
            <small>{t("forSellers")}</small>
          </a>
          <p>{t("sellerWorkplace")}</p>
        </div>

        <div>
          <h3>{t("sellerNavigation")}</h3>
          <nav>
            {footerLinks.map((item) => (
              <a key={item.href} href={item.href}>
                {t(item.labelKey)}
              </a>
            ))}
          </nav>
        </div>

        <div>
          <h3>{t("sellerContacts")}</h3>
          <div className="seller-auth-footer-contacts">
            <span>
              <Phone size={17} aria-hidden="true" />
              +7 900 000-00-00
            </span>
            <span>
              <Mail size={17} aria-hidden="true" />
              seller@marketai.local
            </span>
            <span>
              <MapPin size={17} aria-hidden="true" />
              Екатеринбург
            </span>
          </div>
        </div>

        <div>
          <h3>{t("sellerSettings")}</h3>
          <div className="seller-auth-footer-settings">
            <div>
              <span className="seller-auth-footer-label">{t("sellerTheme")}</span>
              <div className="theme-switcher" role="group" aria-label={t("sellerTheme")}>
                <button
                  type="button"
                  className={theme === "light" ? "active" : ""}
                  onClick={() => setTheme("light")}
                >
                  <Sun size={16} aria-hidden="true" />
                  {t("lightTheme")}
                </button>
                <button
                  type="button"
                  className={theme === "dark" ? "active" : ""}
                  onClick={() => setTheme("dark")}
                >
                  <Moon size={16} aria-hidden="true" />
                  {t("darkTheme")}
                </button>
              </div>
            </div>

            <label>
              <span className="seller-auth-footer-label seller-auth-footer-language-label">
                <Languages size={16} aria-hidden="true" />
                {t("sellerLanguage")}
              </span>
              <select
                value={lang}
                onChange={(event) => changeLanguage(event.target.value)}
              >
                <option value="ru">Русский</option>
                <option value="en">English</option>
                <option value="kk">Қазақша</option>
              </select>
            </label>
          </div>
        </div>
      </div>

      <div className="seller-auth-footer-bottom">
        <span>{t("sellerFooterCopyright")}</span>
        <span>
          {t("sellerFooterTagline")}
          <Heart size={15} aria-hidden="true" />
        </span>
      </div>
    </footer>
  );
}
