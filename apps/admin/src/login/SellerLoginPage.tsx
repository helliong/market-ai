import { useState } from "react";
import type { FormEvent } from "react";
import { loginSellerAccount } from "../auth-api";
import { SellerAuthFooter } from "../register/SellerAuthFooter";
import "../register/SellerRegisterPage.css";

type SellerLoginPageProps = {
  onSubmit: () => Promise<void> | void;
};

type FormErrors = {
  email?: string;
  password?: string;
};

export function SellerLoginPage({ onSubmit }: SellerLoginPageProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitError, setSubmitError] = useState<string>();
  const [isSubmitting, setIsSubmitting] = useState(false);

  function validateEmail(value: string) {
    if (!value) {
      return "Введите email";
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      return "Введите корректный email";
    }

    return undefined;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const nextErrors: FormErrors = {};
    const trimmedEmail = email.trim();
    const trimmedPassword = password.trim();

    const emailError = validateEmail(trimmedEmail);
    if (emailError) {
      nextErrors.email = emailError;
    }

    if (!trimmedPassword) {
      nextErrors.password = "Введите пароль";
    } else if (trimmedPassword.length < 6) {
      nextErrors.password = "Пароль должен быть не короче 6 символов";
    }

    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    setIsSubmitting(true);
    setSubmitError(undefined);

    try {
      await loginSellerAccount({
        email: trimmedEmail,
        password: trimmedPassword,
      });

      await onSubmit();
    } catch (error) {
      setSubmitError(
        error instanceof Error ? error.message : "Не удалось войти",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="seller-register-page">
      <div className="seller-register-brand">
        <a className="seller-register-logo" href="/">
          <span className="seller-logo-word">
            Market<span>AI</span>
          </span>
          <small>Продавцам</small>
        </a>
      </div>

      <section className="seller-register-shell">
        <div className="seller-register-copy">
          <p className="seller-register-eyebrow">Продавцы MarketAI</p>
          <h1>Вход в кабинет продавца</h1>
          <p>
            Продолжайте управлять витриной, карточками товаров и заказами в
            панели MarketAI.
          </p>

          <div className="seller-register-benefits">
            <div>Управление витриной</div>
            <div>Обновление остатков</div>
            <div>Дашборд заказов</div>
          </div>
        </div>

        <form className="seller-register-form" noValidate onSubmit={handleSubmit}>
          <div>
            <h2>Вход</h2>
            <p>Введите email и пароль от аккаунта продавца.</p>
          </div>

          <label>
            Email
            <input
              className={errors.email ? "is-invalid" : ""}
              type="email"
              value={email}
              onChange={(event) => {
                setEmail(event.target.value);
                setErrors((current) => ({
                  ...current,
                  email: undefined,
                }));
              }}
              placeholder="seller@example.com"
            />
            {errors.email && (
              <span className="seller-register-error">{errors.email}</span>
            )}
          </label>

          <label>
            Пароль
            <input
              className={errors.password ? "is-invalid" : ""}
              type="password"
              value={password}
              onChange={(event) => {
                setPassword(event.target.value);
                setErrors((current) => ({
                  ...current,
                  password: undefined,
                }));
              }}
              placeholder="Введите пароль"
            />
            {errors.password && (
              <span className="seller-register-error">{errors.password}</span>
            )}
          </label>

          {submitError && (
            <p className="seller-register-error">{submitError}</p>
          )}

          <button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Входим..." : "Войти"}
          </button>

          <p className="seller-register-switch">
            Еще нет аккаунта продавца? <a href="/register">Создать</a>
          </p>
        </form>
      </section>

      <SellerAuthFooter />
    </main>
  );
}
