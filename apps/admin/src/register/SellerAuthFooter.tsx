import {
  Bot,
  Heart,
  Languages,
  Mail,
  MapPin,
  Moon,
  Phone,
  Sun,
} from "lucide-react";
import { setLanguage, setTheme, useLanguage, useTheme } from "../settings-store";

const footerLinks = [
  { href: "/dashboard", label: "Обзор" },
  { href: "/register", label: "Регистрация" },
  { href: "/login", label: "Вход" },
  { href: "/agreement", label: "Соглашение" },
];

const languages = ["Русский", "English", "Қазақша"];

export function SellerAuthFooter() {
  const theme = useTheme();
  const language = useLanguage();

  return (
    <footer className="seller-auth-footer">
      <div className="seller-auth-footer-main">
        <div>
          <a className="seller-auth-footer-logo" href="/">
            <span className="seller-auth-footer-logo-icon">
              <Bot size={22} aria-hidden="true" />
            </span>
            <span className="seller-logo-word">
              Market<span>AI</span>
            </span>
            <small>Продавцам</small>
          </a>
          <p>
            Рабочее пространство продавца для витрины, каталога и обработки
            заказов.
          </p>
        </div>

        <div>
          <h3>Навигация</h3>
          <nav>
            {footerLinks.map((item) => (
              <a key={item.href} href={item.href}>
                {item.label}
              </a>
            ))}
          </nav>
        </div>

        <div>
          <h3>Контакты</h3>
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
          <h3>Настройки</h3>
          <div className="seller-auth-footer-settings">
            <div>
              <span className="seller-auth-footer-label">Тема</span>
              <div className="theme-switcher" role="group" aria-label="Выбор темы">
                <button
                  type="button"
                  className={theme === "light" ? "active" : ""}
                  onClick={() => setTheme("light")}
                >
                  <Sun size={16} aria-hidden="true" />
                  Светлая
                </button>
                <button
                  type="button"
                  className={theme === "dark" ? "active" : ""}
                  onClick={() => setTheme("dark")}
                >
                  <Moon size={16} aria-hidden="true" />
                  Темная
                </button>
              </div>
            </div>

            <label>
              <span className="seller-auth-footer-label seller-auth-footer-language-label">
                <Languages size={16} aria-hidden="true" />
                Язык
              </span>
              <select
                value={language}
                onChange={(event) => setLanguage(event.target.value)}
              >
                {languages.map((item) => (
                  <option key={item}>{item}</option>
                ))}
              </select>
            </label>
          </div>
        </div>
      </div>

      <div className="seller-auth-footer-bottom">
        <span>© 2026 MarketAI</span>
        <span>
          Инструменты продавца для управления маркетплейсом
          <Heart size={15} aria-hidden="true" />
        </span>
      </div>
    </footer>
  );
}
