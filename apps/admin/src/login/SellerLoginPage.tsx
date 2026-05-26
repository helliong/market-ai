import { useState } from "react";
import type { FormEvent } from "react";
import { SellerAuthFooter } from "../register/SellerAuthFooter";
import "../register/SellerRegisterPage.css";

type SellerLoginPageProps = {
  onSubmit: (seller: { email: string }) => void;
};

type FormErrors = {
  email?: string;
  password?: string;
};

type ResetPasswordStep = "email" | "code" | "password";

const RESET_PASSWORD_MOCK_CODE = "123456";

export function SellerLoginPage({ onSubmit }: SellerLoginPageProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<FormErrors>({});
  const [resetPasswordStep, setResetPasswordStep] =
    useState<ResetPasswordStep | null>(null);
  const [resetEmail, setResetEmail] = useState("");
  const [resetCode, setResetCode] = useState("");
  const [resetPassword, setResetPassword] = useState("");
  const [resetConfirmPassword, setResetConfirmPassword] = useState("");
  const [resetNotice, setResetNotice] = useState<string>();
  const [resetErrors, setResetErrors] = useState<{
    email?: string;
    code?: string;
    password?: string;
    confirmPassword?: string;
  }>({});
  const isPasswordResetStep = Boolean(resetPasswordStep);

  function validateEmail(value: string) {
    if (!value) {
      return "Введите email";
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      return "Введите корректный email";
    }

    return undefined;
  }

  function resetPasswordFlow() {
    setResetPasswordStep(null);
    setResetEmail("");
    setResetCode("");
    setResetPassword("");
    setResetConfirmPassword("");
    setResetNotice(undefined);
    setResetErrors({});
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
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

    onSubmit({ email: trimmedEmail });
  }

  function handleResetPasswordSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!resetPasswordStep) {
      return;
    }

    const nextErrors: typeof resetErrors = {};

    if (resetPasswordStep === "email") {
      const trimmedEmail = resetEmail.trim();
      const emailError = validateEmail(trimmedEmail);

      if (emailError) {
        nextErrors.email = emailError;
      }

      setResetErrors(nextErrors);

      if (nextErrors.email) {
        return;
      }

      setResetEmail(trimmedEmail);
      setResetPasswordStep("code");
      setResetCode("");
      setResetNotice(
        `Письмо-заглушка отправлено на ${trimmedEmail}. Код: ${RESET_PASSWORD_MOCK_CODE}`,
      );
      return;
    }

    if (resetPasswordStep === "code") {
      if (resetCode.length !== 6) {
        nextErrors.code = "Введите 6 цифр из письма";
      } else if (resetCode !== RESET_PASSWORD_MOCK_CODE) {
        nextErrors.code = "Неверный код из письма";
      }

      setResetErrors(nextErrors);

      if (nextErrors.code) {
        return;
      }

      setResetPasswordStep("password");
      setResetNotice("Код подтвержден. Задайте новый пароль.");
      return;
    }

    const trimmedPassword = resetPassword.trim();
    const trimmedConfirmPassword = resetConfirmPassword.trim();

    if (!trimmedPassword) {
      nextErrors.password = "Введите новый пароль";
    } else if (trimmedPassword.length < 6) {
      nextErrors.password = "Пароль должен быть не короче 6 символов";
    }

    if (!trimmedConfirmPassword) {
      nextErrors.confirmPassword = "Подтвердите новый пароль";
    } else if (trimmedPassword !== trimmedConfirmPassword) {
      nextErrors.confirmPassword = "Пароли не совпадают";
    }

    setResetErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    setEmail(resetEmail);
    setPassword(trimmedPassword);
    resetPasswordFlow();
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

        <form
          className="seller-register-form"
          noValidate
          onSubmit={
            isPasswordResetStep ? handleResetPasswordSubmit : handleSubmit
          }
        >
          <div>
            <h2>{isPasswordResetStep ? "Восстановление пароля" : "Вход"}</h2>
            <p>
              {isPasswordResetStep
                ? resetPasswordStep === "email"
                  ? "Введите email аккаунта, чтобы получить код"
                  : resetPasswordStep === "code"
                    ? "Введите 6 цифр из письма"
                    : "Придумайте новый пароль"
                : "Введите email и пароль от аккаунта продавца."}
            </p>
          </div>

          {isPasswordResetStep ? (
            <>
              {resetNotice && (
                <p className="seller-register-notice">{resetNotice}</p>
              )}

              {resetPasswordStep === "email" && (
                <label>
                  Email
                  <input
                    type="email"
                    value={resetEmail}
                    onChange={(event) => {
                      setResetEmail(event.target.value);
                      setResetErrors((current) => ({
                        ...current,
                        email: undefined,
                      }));
                    }}
                    placeholder="seller@example.com"
                  />
                  {resetErrors.email && (
                    <span className="seller-register-error">
                      {resetErrors.email}
                    </span>
                  )}
                </label>
              )}

              {resetPasswordStep === "code" && (
                <label>
                  Код из письма
                  <input
                    inputMode="numeric"
                    value={resetCode}
                    onChange={(event) => {
                      setResetCode(
                        event.target.value.replace(/\D/g, "").slice(0, 6),
                      );
                      setResetErrors((current) => ({
                        ...current,
                        code: undefined,
                      }));
                    }}
                    placeholder="000000"
                  />
                  {resetErrors.code && (
                    <span className="seller-register-error">
                      {resetErrors.code}
                    </span>
                  )}
                </label>
              )}

              {resetPasswordStep === "password" && (
                <>
                  <label>
                    Новый пароль
                    <input
                      type="password"
                      value={resetPassword}
                      onChange={(event) => {
                        setResetPassword(event.target.value);
                        setResetErrors((current) => ({
                          ...current,
                          password: undefined,
                          confirmPassword: undefined,
                        }));
                      }}
                      placeholder="Введите новый пароль"
                    />
                    {resetErrors.password && (
                      <span className="seller-register-error">
                        {resetErrors.password}
                      </span>
                    )}
                  </label>

                  <label>
                    Подтвердите пароль
                    <input
                      type="password"
                      value={resetConfirmPassword}
                      onChange={(event) => {
                        setResetConfirmPassword(event.target.value);
                        setResetErrors((current) => ({
                          ...current,
                          confirmPassword: undefined,
                        }));
                      }}
                      placeholder="Повторите новый пароль"
                    />
                    {resetErrors.confirmPassword && (
                      <span className="seller-register-error">
                        {resetErrors.confirmPassword}
                      </span>
                    )}
                  </label>
                </>
              )}

              <button type="submit">
                {resetPasswordStep === "email"
                  ? "Отправить письмо"
                  : resetPasswordStep === "code"
                    ? "Подтвердить код"
                    : "Сохранить пароль"}
              </button>

              <button
                className="seller-register-secondary-button"
                type="button"
                onClick={resetPasswordFlow}
              >
                Вернуться ко входу
              </button>
            </>
          ) : (
            <>
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
                  <span className="seller-register-error">
                    {errors.password}
                  </span>
                )}
              </label>

              <button type="submit">Войти</button>

              <p className="seller-register-switch">
                Еще нет аккаунта продавца? <a href="/register">Создать</a>
              </p>

              <button
                className="seller-register-forgot-button"
                type="button"
                onClick={() => {
                  setResetPasswordStep("email");
                  setResetEmail(email);
                  setResetCode("");
                  setResetPassword("");
                  setResetConfirmPassword("");
                  setResetNotice(undefined);
                  setResetErrors({});
                }}
              >
                Забыли пароль?
              </button>
            </>
          )}
        </form>
      </section>

      <SellerAuthFooter />
    </main>
  );
}
