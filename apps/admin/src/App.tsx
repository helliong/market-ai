import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import "./App.css";

type AuthMode = "login" | "register";

type Errors = {
  name?: string;
  email?: string;
  password?: string;
  agreement?: string;
};

const isRegisterPath = () => window.location.pathname.startsWith("/register");

function App() {
  const [mode, setMode] = useState<AuthMode>(
    isRegisterPath() ? "register" : "login",
  );

  useEffect(() => {
    function handlePopState() {
      setMode(isRegisterPath() ? "register" : "login");
    }

    window.addEventListener("popstate", handlePopState);

    return () => {
      window.removeEventListener("popstate", handlePopState);
    };
  }, []);

  function navigate(nextMode: AuthMode) {
    const nextPath = nextMode === "register" ? "/register" : "/login";
    window.history.pushState(null, "", nextPath);
    setMode(nextMode);
  }

  return <SellerAuthPage mode={mode} onNavigate={navigate} />;
}

function SellerAuthPage({
  mode,
  onNavigate,
}: {
  mode: AuthMode;
  onNavigate: (mode: AuthMode) => void;
}) {
  const isRegister = mode === "register";
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isAgreementAccepted, setIsAgreementAccepted] = useState(false);
  const [errors, setErrors] = useState<Errors>({});
  const [submittedEmail, setSubmittedEmail] = useState("");

  const highlights = useMemo(
    () =>
      isRegister
        ? ["Своя витрина", "Карточки товаров", "Заказы в работе"]
        : ["Единый кабинет", "Быстрый доступ", "Контроль продаж"],
    [isRegister],
  );

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const nextErrors: Errors = {};
    const trimmedName = name.trim();
    const trimmedEmail = email.trim();
    const trimmedPassword = password.trim();

    if (isRegister && !trimmedName) {
      nextErrors.name = "В поле ничего нет";
    }

    if (!trimmedEmail) {
      nextErrors.email = "В поле ничего нет";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      nextErrors.email = "Введите корректный email";
    }

    if (!trimmedPassword) {
      nextErrors.password = "В поле ничего нет";
    }

    if (isRegister && !isAgreementAccepted) {
      nextErrors.agreement = "Подтвердите пользовательское соглашение";
    }

    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    setSubmittedEmail(trimmedEmail);
  }

  return (
    <main className="admin-shell">
      <header className="admin-header">
        <a
          className="brand"
          href="/login"
          onClick={(event) => {
            event.preventDefault();
            onNavigate("login");
          }}
        >
          <img className="brand-mark" src="/logo.webp" alt="MarketAI" />
          <span>
            Market<span>AI</span>
          </span>
        </a>

        <nav className="auth-switch" aria-label="Авторизация продавца">
          <button
            type="button"
            className={mode === "login" ? "active" : ""}
            onClick={() => onNavigate("login")}
          >
            Вход
          </button>
          <button
            type="button"
            className={mode === "register" ? "active" : ""}
            onClick={() => onNavigate("register")}
          >
            Регистрация
          </button>
        </nav>
      </header>

      <section className="auth-layout">
        <div className="auth-copy">
          <p className="eyebrow">MarketAI для продавцов</p>
          <h1>
            {isRegister
              ? "Создайте кабинет продавца"
              : "Войдите в кабинет продавца"}
          </h1>
          <p className="lead">
            {isRegister
              ? "Зарегистрируйте магазин, чтобы подготовить витрину, карточки товаров и управление заказами."
              : "Продолжайте работу с витриной, товарами и заказами в отдельной админке MarketAI."}
          </p>

          <div className="feature-row">
            {highlights.map((item) => (
              <span key={item}>{item}</span>
            ))}
          </div>
        </div>

        <form noValidate className="auth-card" onSubmit={handleSubmit}>
          <div className="form-heading">
            <h2>{isRegister ? "Регистрация" : "Вход"}</h2>
            <p>
              {isRegister
                ? "Заполните данные для создания аккаунта продавца"
                : "Введите email и пароль от аккаунта продавца"}
            </p>
          </div>

          <div className="form-stack">
            {isRegister && (
              <AuthField
                label="Название магазина"
                value={name}
                onChange={(value) => {
                  setName(value);
                  setErrors((current) => ({ ...current, name: undefined }));
                }}
                placeholder="Market store"
                type="text"
                error={errors.name}
              />
            )}

            <AuthField
              label="Email"
              value={email}
              onChange={(value) => {
                setEmail(value);
                setErrors((current) => ({ ...current, email: undefined }));
              }}
              placeholder="you@example.com"
              type="email"
              error={errors.email}
            />

            <AuthField
              label="Пароль"
              value={password}
              onChange={(value) => {
                setPassword(value);
                setErrors((current) => ({ ...current, password: undefined }));
              }}
              placeholder="Введите пароль"
              type="password"
              error={errors.password}
            />

            {isRegister && (
              <label className="agreement">
                <span
                  className={
                    isAgreementAccepted ? "checkbox checked" : "checkbox"
                  }
                />
                <input
                  type="checkbox"
                  checked={isAgreementAccepted}
                  onChange={(event) => {
                    setIsAgreementAccepted(event.target.checked);
                    setErrors((current) => ({
                      ...current,
                      agreement: undefined,
                    }));
                  }}
                />
                <span>
                  Я принимаю{" "}
                  <a href="/agreement">пользовательское соглашение</a>
                </span>
              </label>
            )}

            {errors.agreement && (
              <span className="field-error">{errors.agreement}</span>
            )}
          </div>

          <button type="submit" className="primary-action">
            {isRegister ? "Зарегистрироваться" : "Войти"}
          </button>

          {submittedEmail && (
            <p className="success-message">
              {isRegister ? "Аккаунт подготовлен" : "Вход выполнен"}:{" "}
              {submittedEmail}
            </p>
          )}

          <p className="alternate-action">
            {isRegister ? "Уже есть аккаунт?" : "Еще нет аккаунта?"}{" "}
            <button
              type="button"
              onClick={() => onNavigate(isRegister ? "login" : "register")}
            >
              {isRegister ? "Войти" : "Зарегистрироваться"}
            </button>
          </p>
        </form>
      </section>
    </main>
  );
}

function AuthField({
  label,
  value,
  onChange,
  placeholder,
  type,
  error,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  type: string;
  error?: string;
}) {
  return (
    <label className="field">
      <span>{label}</span>
      <input
        className={error ? "invalid" : ""}
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
      />
      {error && <span className="field-error">{error}</span>}
    </label>
  );
}

export default App;
