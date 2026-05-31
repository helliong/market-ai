import { useState } from "react";
import type { FormEvent } from "react";
import { CheckCircle2, X, XCircle } from "lucide-react";
import {
  registerSellerProfile,
  resendSellerVerificationCode,
  verifySellerEmail,
} from "../auth-api";
import { SellerAuthFooter } from "./SellerAuthFooter";
import { useLanguage } from "../hooks/useLanguage";
import "./SellerRegisterPage.css";

type SellerRegisterPageProps = {
  onSubmit: (seller: { name: string; email: string }) => void;
};

type PendingSeller = {
  name: string;
  email: string;
};

type ToastState = {
  id: number;
  message: string;
  variant: "success" | "error";
};

type FormErrors = {
  name?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
  agreement?: string;
};

export function SellerRegisterPage({ onSubmit }: SellerRegisterPageProps) {
  const { t } = useLanguage();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isAgreementAccepted, setIsAgreementAccepted] = useState(false);
  const [pendingSeller, setPendingSeller] = useState<PendingSeller | null>(null);
  const [verificationCode, setVerificationCode] = useState("");
  const [verificationError, setVerificationError] = useState<string>();
  const [submitError, setSubmitError] = useState<string>();
  const [toast, setToast] = useState<ToastState | null>(null);
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

    if (!trimmedName) nextErrors.name = t("errorStoreNameRequired");
    if (!trimmedEmail) nextErrors.email = t("errorEmailRequired");
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) nextErrors.email = t("errorInvalidEmail");
    if (!trimmedPassword) nextErrors.password = t("errorPasswordRequired");
    else if (trimmedPassword.length < 6) nextErrors.password = t("errorPasswordMinLength");
    if (!trimmedConfirmPassword) nextErrors.confirmPassword = t("errorConfirmPasswordRequired");
    else if (trimmedPassword && trimmedPassword !== trimmedConfirmPassword) nextErrors.confirmPassword = t("errorPasswordsDoNotMatch");
    if (!isAgreementAccepted) nextErrors.agreement = t("errorAgreementRequired");

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setIsSubmitting(true);
    setSubmitError(undefined);

    try {
      await registerSellerProfile({
        email: trimmedEmail,
        password: trimmedPassword,
        storeName: trimmedName,
        agreementAccepted: isAgreementAccepted,
      });
      setPendingSeller({ name: trimmedName, email: trimmedEmail });
      setVerificationCode("");
      setVerificationError(undefined);
      showToast(t("successRegistration"), "success");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : t("errorAuthRequestFailed");
      setSubmitError(message);
      showToast(message, "error");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleEmailConfirmationSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!pendingSeller) return;
    if (!/^\d{6}$/.test(verificationCode.trim())) {
      setVerificationError(t("errorVerificationCodeRequired"));
      return;
    }
    setIsSubmitting(true);
    setVerificationError(undefined);
    try {
      await verifySellerEmail({ email: pendingSeller.email, code: verificationCode });
      onSubmit(pendingSeller);
    } catch (error) {
      setVerificationError(error instanceof Error ? error.message : t("errorInvalidVerificationCode"));
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleResendCode() {
    if (!pendingSeller) return;
    setIsSubmitting(true);
    setVerificationError(undefined);
    try {
      await resendSellerVerificationCode(pendingSeller.email);
      showToast(t("resendCode"), "success");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : t("errorResendCodeFailed");
      setVerificationError(message);
      showToast(message, "error");
    } finally {
      setIsSubmitting(false);
    }
  }

  function showToast(message: string, variant: ToastState["variant"]) {
    const id = Date.now();
    setToast({ id, message, variant });
    window.setTimeout(() => {
      setToast((current) => (current?.id === id ? null : current));
    }, 4200);
  }

  return (
    <main className="seller-register-page">
      {toast && (
        <ToastNotification
          message={toast.message}
          variant={toast.variant}
          onClose={() => setToast(null)}
        />
      )}

      <div className="seller-register-brand">
        <a className="seller-register-logo" href="/">
          <span className="seller-logo-word">
            Market<span>AI</span>
          </span>
          <small>{t("forSellers")}</small>
        </a>
      </div>

      <section className="seller-register-shell">
        <div className="seller-register-copy">
          <p className="seller-register-eyebrow">{t("sellersMarketAI")}</p>
          <h1>{t("createSellerAccount")}</h1>
          <p>{t("registerDesc")}</p>
          <div className="seller-register-benefits">
            {t("registerBenefits").split(",").map((item, idx) => (
              <div key={idx}>{item}</div>
            ))}
          </div>
        </div>

        <form
          className="seller-register-form"
          noValidate
          onSubmit={isEmailConfirmationStep ? handleEmailConfirmationSubmit : handleSubmit}
        >
          {isEmailConfirmationStep ? (
            <>
              <div>
                <h2>{t("emailConfirmation")}</h2>
                <p>{t("codeSentTo")} {pendingSeller?.email}.</p>
              </div>
              <label>
                {t("verificationCode")}
                <input
                  className={verificationError ? "is-invalid" : ""}
                  inputMode="numeric"
                  value={verificationCode}
                  onChange={(event) => {
                    setVerificationCode(event.target.value.replace(/\D/g, "").slice(0, 6));
                    setVerificationError(undefined);
                  }}
                  placeholder={t("codePlaceholder")}
                />
                {verificationError && <span className="seller-register-error">{verificationError}</span>}
              </label>
              <button type="submit" disabled={isSubmitting}>
                {isSubmitting ? t("loading") : t("confirmEmail")}
              </button>
              <button
                className="seller-register-secondary-button"
                type="button"
                onClick={handleResendCode}
                disabled={isSubmitting}
              >
                {t("resendCode")}
              </button>
              <button
                className="seller-register-secondary-button"
                type="button"
                onClick={() => {
                  setPendingSeller(null);
                  setVerificationCode("");
                  setVerificationError(undefined);
                  setSubmitError(undefined);
                }}
              >
                {t("changeRegistrationData")}
              </button>
              <p className="seller-register-switch">{t("codeSentTo")} {pendingSeller?.email}</p>
            </>
          ) : (
            <>
              <div>
                <h2>{t("registration")}</h2>
                <p>{t("fillData")}</p>
              </div>
              <label>
                {t("storeName")}
                <input
                  className={errors.name ? "is-invalid" : ""}
                  value={name}
                  onChange={(event) => {
                    setName(event.target.value);
                    setErrors((current) => ({ ...current, name: undefined }));
                  }}
                  placeholder="Market store"
                />
                {errors.name && <span className="seller-register-error">{errors.name}</span>}
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
                    setErrors((current) => ({
                      ...current,
                      password: undefined,
                      confirmPassword: undefined,
                    }));
                  }}
                  placeholder={t("password")}
                />
                {errors.password && <span className="seller-register-error">{errors.password}</span>}
              </label>
              <label>
                {t("confirmPassword")}
                <input
                  className={errors.confirmPassword ? "is-invalid" : ""}
                  type="password"
                  value={confirmPassword}
                  onChange={(event) => {
                    setConfirmPassword(event.target.value);
                    setErrors((current) => ({ ...current, confirmPassword: undefined }));
                  }}
                  placeholder={t("confirmPassword")}
                />
                {errors.confirmPassword && <span className="seller-register-error">{errors.confirmPassword}</span>}
              </label>
              <label className="seller-register-agreement">
                <span
                  className={`seller-register-checkbox ${isAgreementAccepted ? "is-checked" : ""}`}
                  aria-hidden="true"
                >
                  {isAgreementAccepted && (
                    <svg aria-hidden="true" fill="none" height="14" viewBox="0 0 24 24" width="14">
                      <path d="M20 6 9 17l-5-5" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" />
                    </svg>
                  )}
                </span>
                <input
                  type="checkbox"
                  checked={isAgreementAccepted}
                  onChange={(event) => {
                    setIsAgreementAccepted(event.target.checked);
                    setErrors((current) => ({ ...current, agreement: undefined }));
                  }}
                />
                <span>
                  {t("iAccept")} <a href="/agreement" target="_blank" rel="noopener noreferrer">{t("userAgreement")}</a>
                </span>
              </label>
              {errors.agreement && <span className="seller-register-error seller-register-agreement-error">{errors.agreement}</span>}
              {submitError && <p className="seller-register-error">{submitError}</p>}
              <button type="submit" disabled={isSubmitting}>
                {isSubmitting ? t("loading") : t("registerButton")}
              </button>
              <p className="seller-register-switch">
                {t("alreadyHaveAccount")} <a href="/login">{t("loginLink")}</a>
              </p>
            </>
          )}
        </form>
      </section>

      <SellerAuthFooter />
    </main>
  );
}

function ToastNotification({
  message,
  variant,
  onClose,
}: {
  message: string;
  variant: ToastState["variant"];
  onClose: () => void;
}) {
  const Icon = variant === "success" ? CheckCircle2 : XCircle;

  return (
    <div className={`toast-notification toast-notification-${variant}`}>
      <Icon aria-hidden="true" />
      <span>{message}</span>
      <button type="button" aria-label="Close notification" onClick={onClose}>
        <X aria-hidden="true" />
      </button>
    </div>
  );
}
