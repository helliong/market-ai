import { useEffect, useState } from "react";
import { Info, X } from "lucide-react";

const COOKIE_CONSENT_STORAGE_KEY = "cookieConsent";

export function CookieBanner() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(!localStorage.getItem(COOKIE_CONSENT_STORAGE_KEY));
  }, []);

  function acceptCookies() {
    localStorage.setItem(COOKIE_CONSENT_STORAGE_KEY, "true");
    setIsVisible(false);
  }

  if (!isVisible) {
    return null;
  }

  return (
    <div className="cookie-banner" role="region" aria-label="Cookie notice">
      <div className="cookie-banner-card">
        <span className="cookie-banner-icon">
          <Info aria-hidden="true" />
        </span>
        <div className="cookie-banner-copy">
          <strong>Мы используем файлы cookie</strong>
          <p>
            Продолжая пользоваться кабинетом продавца, вы соглашаетесь с
            использованием cookie для авторизации и улучшения работы сервиса.
          </p>
        </div>
        <button
          type="button"
          className="cookie-banner-accept"
          onClick={acceptCookies}
        >
          Принять
        </button>
        <button
          type="button"
          className="cookie-banner-close"
          aria-label="Закрыть"
          onClick={acceptCookies}
        >
          <X aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}
