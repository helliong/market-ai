import { useState } from "react";
import type { FormEvent } from "react";
import {
  loginSellerAccount,
  requestSellerPasswordReset,
  resetSellerPassword,
} from "../auth-api";
import { SellerAuthFooter } from "../register/SellerAuthFooter";
import { useLanguage } from "../hooks/useLanguage";
import "../register/SellerRegisterPage.css";

type SellerLoginPageProps = {
  onSubmit: () => Promise<void> | void;
};

type FormErrors = {
  email?: string;
  password?: string;
};

type ResetPasswordStep = "email" | "code" | "password";

type ResetErrors = {
  email?: string;
  code?: string;
  password?: string;
  confirmPassword?: string;
};

export function SellerLoginPage({ onSubmit }: SellerLoginPageProps) {
  const { t } = useLanguage();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [resetPasswordStep, setResetPasswordStep] =
    useState<ResetPasswordStep | null>(null);
  const [resetEmail, setResetEmail] = useState("");
  const [resetCode, setResetCode] = useState("");
  const [resetPassword, setResetPassword] = useState("");
  const [resetConfirmPassword, setResetConfirmPassword] = useState("");
  const [resetNotice, setResetNotice] = useState<string>();
  const [resetErrors, setResetErrors] = useState<ResetErrors>({});
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitError, setSubmitError] = useState<string>();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isPasswordResetStep = Boolean(resetPasswordStep);

  function validateEmail(value: string) {
    if (!value) return t("errorEmailRequired");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return t("errorInvalidEmail");
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
    setIsSubmitting(false);
  }

  async function handleResetPasswordSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!resetPasswordStep) return;
    const nextErrors: ResetErrors = {};

    if (resetPasswordStep === "email") {
      const trimmedEmail = resetEmail.trim();
      const emailError = validateEmail(trimmedEmail);
      if (emailError) nextErrors.email = emailError;
      setResetErrors(nextErrors);
      if (nextErrors.email) return;
      setIsSubmitting(true);
      setSubmitError(undefined);
      try {
        await requestSellerPasswordReset({ email: trimmedEmail });
        setResetEmail(trimmedEmail);
        setResetCode("");
        setResetPasswordStep("code");
        setResetNotice(`${t("resetPasswordEmailSent")} ${trimmedEmail}.`);
      } catch (error) {
        setSubmitError(
          error instanceof Error ? error.message : t("errorPasswordResetFailed")
        );
      } finally {
        setIsSubmitting(false);
      }
      return;
    }

    if (resetPasswordStep === "code") {
      if (resetCode.length !== 6) nextErrors.code = t("errorVerificationCodeRequired");
      setResetErrors(nextErrors);
      if (nextErrors.code) return;
      setResetPasswordStep("password");
      setResetNotice(t("resetCodeAccepted"));
      return;
    }

    const trimmedPassword = resetPassword.trim();
    const trimmedConfirmPassword = resetConfirmPassword.trim();
    if (!trimmedPassword) nextErrors.password = t("errorPasswordRequired");
    else if (trimmedPassword.length < 6) nextErrors.password = t("errorPasswordMinLength");
    if (!trimmedConfirmPassword) nextErrors.confirmPassword = t("errorConfirmPasswordRequired");
    else if (trimmedPassword !== trimmedConfirmPassword) nextErrors.confirmPassword = t("errorPasswordsDoNotMatch");
    setResetErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;
    setIsSubmitting(true);
    setSubmitError(undefined);
    try {
      await resetSellerPassword({
        email: resetEmail,
        code: resetCode,
        password: trimmedPassword,
      });
      setEmail(resetEmail);
      setPassword("");
      resetPasswordFlow();
      setSubmitError(undefined);
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : t("errorPasswordResetFailed"));
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextErrors: FormErrors = {};
    const trimmedEmail = email.trim();
    const trimmedPassword = password.trim();
    const emailError = validateEmail(trimmedEmail);
    if (emailError) nextErrors.email = emailError;
    if (!trimmedPassword) nextErrors.password = t("errorPasswordRequired");
    else if (trimmedPassword.length < 6) nextErrors.password = t("errorPasswordMinLength");
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;
    setIsSubmitting(true);
    setSubmitError(undefined);
    try {
      await loginSellerAccount({ email: trimmedEmail, password: trimmedPassword });
      await onSubmit();
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : t("errorInvalidCredentials"));
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
          <p className="seller-register-eyebrow">{t("sellersMarketAI")}</p>
          <h1>{t("sellerLoginTitle")}</h1>
          <p>{t("sellerLoginDesc")}</p>
          <div className="seller-register-benefits">
            {t("benefits").split(",").map((item, idx) => (
              <div key={idx}>{item}</div>
            ))}
          </div>
        </div>

        <form
          className="seller-register-form"
          noValidate
          onSubmit={isPasswordResetStep ? handleResetPasswordSubmit : handleSubmit}
        >
          <div>
            <h2>{isPasswordResetStep ? t("resetPassword") : t("loginButton")}</h2>
            <p>
              {resetPasswordStep === "email"
                ? t("resetEmailStep")
                : resetPasswordStep === "code"
                ? t("resetCodeStep")
                : resetPasswordStep === "password"
                ? t("resetPasswordStep")
                : t("sellerLoginDesc")}
            </p>
          </div>

          {isPasswordResetStep ? (
            <>
              {resetNotice && <p className="seller-register-notice">{resetNotice}</p>}
              {resetPasswordStep === "email" && (
                <label>
                  Email
                  <input
                    className={resetErrors.email ? "is-invalid" : ""}
                    type="email"
                    value={resetEmail}
                    onChange={(event) => {
                      setResetEmail(event.target.value);
                      setResetErrors((current) => ({ ...current, email: undefined }));
                    }}
                    placeholder={t("emailPlaceholder")}
                  />
                  {resetErrors.email && <span className="seller-register-error">{resetErrors.email}</span>}
                </label>
              )}
              {resetPasswordStep === "code" && (
                <label>
                  {t("verificationCode")}
                  <input
                    className={resetErrors.code ? "is-invalid" : ""}
                    inputMode="numeric"
                    type="text"
                    value={resetCode}
                    onChange={(event) => {
                      setResetCode(event.target.value.replace(/\D/g, "").slice(0, 6));
                      setResetErrors((current) => ({ ...current, code: undefined }));
                    }}
                    placeholder={t("codePlaceholder")}
                  />
                  {resetErrors.code && <span className="seller-register-error">{resetErrors.code}</span>}
                </label>
              )}
              {resetPasswordStep === "password" && (
                <>
                  <label>
                    {t("newPassword")}
                    <input
                      className={resetErrors.password ? "is-invalid" : ""}
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
                      placeholder={t("newPassword")}
                    />
                    {resetErrors.password && <span className="seller-register-error">{resetErrors.password}</span>}
                  </label>
                  <label>
                    {t("confirmPassword")}
                    <input
                      className={resetErrors.confirmPassword ? "is-invalid" : ""}
                      type="password"
                      value={resetConfirmPassword}
                      onChange={(event) => {
                        setResetConfirmPassword(event.target.value);
                        setResetErrors((current) => ({
                          ...current,
                          confirmPassword: undefined,
                        }));
                      }}
                      placeholder={t("confirmPassword")}
                    />
                    {resetErrors.confirmPassword && <span className="seller-register-error">{resetErrors.confirmPassword}</span>}
                  </label>
                </>
              )}
              {submitError && <p className="seller-register-error">{submitError}</p>}
              <button type="submit" disabled={isSubmitting}>
                {isSubmitting
                  ? t("loading")
                  : resetPasswordStep === "email"
                  ? t("sendEmail")
                  : resetPasswordStep === "code"
                  ? t("confirmCode")
                  : t("saveNewPassword")}
              </button>
              <button
                type="button"
                className="seller-register-secondary-button"
                onClick={resetPasswordFlow}
              >
                {t("backToLogin")}
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
                    setErrors((current) => ({ ...current, email: undefined }));
                  }}
                  placeholder={t("emailPlaceholder")}
                />
                {errors.email && <span className="seller-register-error">{errors.email}</span>}
              </label>
              <label>
                {t("password")}
                <input
                  className={errors.password ? "is-invalid" : ""}
                  type="password"
                  value={password}
                  onChange={(event) => {
                    setPassword(event.target.value);
                    setErrors((current) => ({ ...current, password: undefined }));
                  }}
                  placeholder={t("password")}
                />
                {errors.password && <span className="seller-register-error">{errors.password}</span>}
              </label>
              {submitError && <p className="seller-register-error">{submitError}</p>}
              <button type="submit" disabled={isSubmitting}>
                {isSubmitting ? t("loading") : t("loginButton")}
              </button>
              <p className="seller-register-switch">
                {t("noAccountYet")} <a href="/register">{t("createAccount")}</a>
              </p>
              <button
                type="button"
                className="seller-register-forgot-button"
                onClick={() => {
                  setResetPasswordStep("email");
                  setResetEmail(email);
                  setResetCode("");
                  setResetPassword("");
                  setResetConfirmPassword("");
                  setResetNotice(undefined);
                  setResetErrors({});
                  setSubmitError(undefined);
                }}
              >
                {t("forgotPassword")}
              </button>
            </>
          )}
        </form>
      </section>

      <SellerAuthFooter />
    </main>
  );
}