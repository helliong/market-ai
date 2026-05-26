import { useState } from "react";
import type { FormEvent } from "react";
import {
  registerSellerProfile,
  resendSellerVerificationCode,
  verifySellerEmail,
} from "../auth-api";
import { SellerAuthFooter } from "./SellerAuthFooter";
import "./SellerRegisterPage.css";

type SellerRegisterPageProps = {
  onSubmit: (seller: { name: string; email: string }) => void;
};

type PendingSeller = {
  name: string;
  email: string;
};

type FormErrors = {
  name?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
  agreement?: string;
};

export function SellerRegisterPage({ onSubmit }: SellerRegisterPageProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isAgreementAccepted, setIsAgreementAccepted] = useState(false);
  const [pendingSeller, setPendingSeller] = useState<PendingSeller | null>(
    null,
  );
  const [verificationCode, setVerificationCode] = useState("");
  const [verificationError, setVerificationError] = useState<string>();
  const [submitError, setSubmitError] = useState<string>();
  const [notice, setNotice] = useState<string>();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const isEmailConfirmationStep = Boolean(pendingSeller);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const nextErrors: FormErrors = {};
    const trimmedName = name.trim();
    const trimmedEmail = email.trim();
    const trimmedPassword = password.trim();
    const trimmedConfirmPassword = confirmPassword.trim();

    if (!trimmedName) {
      nextErrors.name = "Введите название магазина";
    }

    if (!trimmedEmail) {
      nextErrors.email = "Введите email";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      nextErrors.email = "Введите корректный email";
    }

    if (!trimmedPassword) {
      nextErrors.password = "Введите пароль";
    } else if (trimmedPassword.length < 6) {
      nextErrors.password = "Пароль должен быть не короче 6 символов";
    }

    if (!trimmedConfirmPassword) {
      nextErrors.confirmPassword = "Подтвердите пароль";
    } else if (trimmedPassword && trimmedPassword !== trimmedConfirmPassword) {
      nextErrors.confirmPassword = "Пароли не совпадают";
    }

    if (!isAgreementAccepted) {
      nextErrors.agreement = "Примите пользовательское соглашение";
    }

    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    setIsSubmitting(true);
    setSubmitError(undefined);
    setNotice(undefined);

    try {
      await registerSellerProfile({
        email: trimmedEmail,
        password: trimmedPassword,
        storeName: trimmedName,
        agreementAccepted: isAgreementAccepted,
      });

      setPendingSeller({
        name: trimmedName,
        email: trimmedEmail,
      });
      setVerificationCode("");
      setVerificationError(undefined);
      setNotice("Код подтверждения отправлен на email.");
    } catch (error) {
      setSubmitError(
        error instanceof Error ? error.message : "Не удалось создать магазин",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleEmailConfirmationSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    if (!pendingSeller) {
      return;
    }

    if (!/^\d{6}$/.test(verificationCode.trim())) {
      setVerificationError("Введите 6-значный код");
      return;
    }

    setIsSubmitting(true);
    setVerificationError(undefined);

    try {
      await verifySellerEmail({
        email: pendingSeller.email,
        code: verificationCode,
      });

      onSubmit(pendingSeller);
    } catch (error) {
      setVerificationError(
        error instanceof Error ? error.message : "Неверный код подтверждения",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleResendCode() {
    if (!pendingSeller) {
      return;
    }

    setIsSubmitting(true);
    setVerificationError(undefined);
    setNotice(undefined);

    try {
      await resendSellerVerificationCode(pendingSeller.email);
      setNotice("Новый код отправлен на email.");
    } catch (error) {
      setVerificationError(
        error instanceof Error ? error.message : "Не удалось отправить код",
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
          <h1>Создание аккаунта продавца</h1>
          <p>
            Зарегистрируйте магазин, чтобы подготовить товары, управлять
            заказами и открыть рабочую панель маркетплейса.
          </p>

          <div className="seller-register-benefits">
            <div>Настройка витрины</div>
            <div>Карточки товаров</div>
            <div>Заказы в работе</div>
          </div>
        </div>

        <form
          className="seller-register-form"
          noValidate
          onSubmit={
            isEmailConfirmationStep
              ? handleEmailConfirmationSubmit
              : handleSubmit
          }
        >
          {isEmailConfirmationStep ? (
            <>
              <div>
                <h2>Подтверждение email</h2>
                <p>
                  Введите код подтверждения, отправленный на{" "}
                  {pendingSeller?.email}.
                </p>
              </div>

              {notice && <p className="seller-register-notice">{notice}</p>}

              <label>
                Код подтверждения
                <input
                  className={verificationError ? "is-invalid" : ""}
                  inputMode="numeric"
                  value={verificationCode}
                  onChange={(event) => {
                    setVerificationCode(
                      event.target.value.replace(/\D/g, "").slice(0, 6),
                    );
                    setVerificationError(undefined);
                  }}
                  placeholder="000000"
                />
                {verificationError && (
                  <span className="seller-register-error">
                    {verificationError}
                  </span>
                )}
              </label>

              <button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Проверяем..." : "Подтвердить email"}
              </button>

              <button
                className="seller-register-secondary-button"
                type="button"
                onClick={handleResendCode}
                disabled={isSubmitting}
              >
                Отправить код ещё раз
              </button>

              <button
                className="seller-register-secondary-button"
                type="button"
                onClick={() => {
                  setPendingSeller(null);
                  setVerificationCode("");
                  setVerificationError(undefined);
                  setSubmitError(undefined);
                  setNotice(undefined);
                }}
              >
                Изменить данные регистрации
              </button>

              <p className="seller-register-switch">
                Проверьте почту и введите 6-значный код.
              </p>
            </>
          ) : (
            <>
              <div>
                <h2>Регистрация</h2>
                <p>
                  Заполните данные магазина, чтобы создать профиль продавца.
                </p>
              </div>

              <label>
                Название магазина
                <input
                  className={errors.name ? "is-invalid" : ""}
                  value={name}
                  onChange={(event) => {
                    setName(event.target.value);
                    setErrors((current) => ({ ...current, name: undefined }));
                  }}
                  placeholder="Market store"
                />
                {errors.name && (
                  <span className="seller-register-error">{errors.name}</span>
                )}
              </label>

              <label>
                Email
                <input
                  className={errors.email ? "is-invalid" : ""}
                  type="email"
                  value={email}
                  onChange={(event) => {
                    setEmail(event.target.value);
                    setErrors((current) => ({ ...current, email: undefined }));
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
                      confirmPassword: undefined,
                    }));
                  }}
                  placeholder="Пароль от аккаунта"
                />
                {errors.password && (
                  <span className="seller-register-error">
                    {errors.password}
                  </span>
                )}
              </label>

              <label>
                Подтверждение пароля
                <input
                  className={errors.confirmPassword ? "is-invalid" : ""}
                  type="password"
                  value={confirmPassword}
                  onChange={(event) => {
                    setConfirmPassword(event.target.value);
                    setErrors((current) => ({
                      ...current,
                      confirmPassword: undefined,
                    }));
                  }}
                  placeholder="Повторите пароль"
                />
                {errors.confirmPassword && (
                  <span className="seller-register-error">
                    {errors.confirmPassword}
                  </span>
                )}
              </label>

              <label className="seller-register-agreement">
                <span
                  className={`seller-register-checkbox ${
                    isAgreementAccepted ? "is-checked" : ""
                  }`}
                  aria-hidden="true"
                >
                  {isAgreementAccepted && (
                    <svg
                      aria-hidden="true"
                      fill="none"
                      height="14"
                      viewBox="0 0 24 24"
                      width="14"
                    >
                      <path
                        d="M20 6 9 17l-5-5"
                        stroke="currentColor"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="3"
                      />
                    </svg>
                  )}
                </span>
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
                  <a
                    href="/agreement"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    пользовательское соглашение
                  </a>
                </span>
              </label>
              {errors.agreement && (
                <span className="seller-register-error seller-register-agreement-error">
                  {errors.agreement}
                </span>
              )}

              {submitError && (
                <p className="seller-register-error">{submitError}</p>
              )}

              <button type="submit" disabled={isSubmitting}>
                {isSubmitting
                  ? "Создаём..."
                  : "Создать аккаунт продавца"}
              </button>

              <p className="seller-register-switch">
                Уже продаёте на MarketAI? <a href="/login">Войти</a>
              </p>
            </>
          )}
        </form>
      </section>

      <SellerAuthFooter />
    </main>
  );
}
