import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import {
  loginSellerAccount,
  requestSellerPasswordReset,
  resetSellerPassword,
  verifySellerPasswordResetCode,
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

const LOGIN_RATE_LIMIT_STORAGE_KEY = "marketai.admin.loginRateLimit";
const LOGIN_RATE_LIMIT_MAX_ATTEMPTS = 5;
const LOGIN_RATE_LIMIT_WINDOW_MS = 60_000;
const LOGIN_RATE_LIMIT_LOCK_MS = 5 * 60_000;

type LoginRateLimitState = {
  attempts: number;
  windowStartedAt: number;
  lockedUntil: number;
};

const initialLoginRateLimitState: LoginRateLimitState = {
  attempts: 0,
  windowStartedAt: 0,
  lockedUntil: 0,
};

// Страница входа продавца: логин, rate limit и восстановление seller-пароля.
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
  const [resetErrors, setResetErrors] = useState<ResetErrors>({});
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitError, setSubmitError] = useState<string>();
  const [loginRateLimit, setLoginRateLimit] =
    useState<LoginRateLimitState>(() => readLoginRateLimitState());
  const [now, setNow] = useState(() => Date.now());
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isPasswordResetStep = Boolean(resetPasswordStep);
  const loginCooldownMs =
    !isPasswordResetStep && loginRateLimit.lockedUntil > now
      ? loginRateLimit.lockedUntil - now
      : 0;
  const isLoginRateLimited = loginCooldownMs > 0;

  useEffect(() => {
    if (!isLoginRateLimited) {
      return;
    }

    const intervalId = window.setInterval(() => {
      setNow(Date.now());
    }, 1_000);

    return () => window.clearInterval(intervalId);
  }, [isLoginRateLimited]);

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
      } catch (error) {
        const message = getLocalizedAuthError(
          error,
          t,
          t("errorPasswordResetFailed"),
        );
        setSubmitError(message);
      } finally {
        setIsSubmitting(false);
      }
      return;
    }

    if (resetPasswordStep === "code") {
      if (resetCode.length !== 6) nextErrors.code = t("errorVerificationCodeRequired");
      setResetErrors(nextErrors);
      if (nextErrors.code) return;
      setIsSubmitting(true);
      setSubmitError(undefined);

      try {
        await verifySellerPasswordResetCode({
          email: resetEmail,
          code: resetCode,
        });
        setResetPasswordStep("password");
      } catch (error) {
        setResetErrors({
          code: getLocalizedAuthError(
            error,
            t,
            t("errorInvalidVerificationCode"),
          ),
        });
      } finally {
        setIsSubmitting(false);
      }
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
      const message = getLocalizedAuthError(
        error,
        t,
        t("errorPasswordResetFailed"),
      );
      setSubmitError(message);
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const currentTime = Date.now();

    if (loginRateLimit.lockedUntil > currentTime) {
      setNow(currentTime);
      setSubmitError(undefined);
      return;
    }

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
      resetLoginRateLimitState(setLoginRateLimit);
      await onSubmit();
    } catch (error) {
      const nextRateLimit = recordFailedLoginAttempt();
      const currentTime = Date.now();
      setLoginRateLimit(nextRateLimit);
      setNow(currentTime);

      if (nextRateLimit.lockedUntil > currentTime) {
        setSubmitError(undefined);
        return;
      }

      const message = getLocalizedAuthError(error, t, t("errorInvalidCredentials"));
      setSubmitError(message);
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
          <small>{t("forSellers")}</small>
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
              {resetPasswordStep === "email" && (
                <label>
                  {t("userEmail")}
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
                      placeholder={t("newPasswordPlaceholder")}
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
                      placeholder={t("confirmPasswordPlaceholder")}
                    />
                    {resetErrors.confirmPassword && <span className="seller-register-error">{resetErrors.confirmPassword}</span>}
                  </label>
                </>
              )}
              {submitError && (
                <p className="seller-register-error seller-auth-inline-notice">
                  {submitError}
                </p>
              )}
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
                {t("userEmail")}
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
                  placeholder={t("passwordPlaceholder")}
                />
                {errors.password && <span className="seller-register-error">{errors.password}</span>}
              </label>
              {submitError && !isLoginRateLimited && (
                <p className="seller-register-error seller-auth-inline-notice">
                  {submitError}
                </p>
              )}
              {isLoginRateLimited && (
                <p className="seller-login-rate-notice">
                  {getLoginRateLimitMessage(loginCooldownMs, t)}
                </p>
              )}
              <button type="submit" disabled={isSubmitting || isLoginRateLimited}>
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

// Читает сохраненное состояние лимита попыток входа из localStorage.
function readLoginRateLimitState(): LoginRateLimitState {
  try {
    const storedValue = window.localStorage.getItem(LOGIN_RATE_LIMIT_STORAGE_KEY);

    if (!storedValue) {
      return initialLoginRateLimitState;
    }

    const parsed = JSON.parse(storedValue) as Partial<LoginRateLimitState>;

    return {
      attempts: typeof parsed.attempts === "number" ? parsed.attempts : 0,
      windowStartedAt:
        typeof parsed.windowStartedAt === "number" ? parsed.windowStartedAt : 0,
      lockedUntil:
        typeof parsed.lockedUntil === "number" ? parsed.lockedUntil : 0,
    };
  } catch {
    return initialLoginRateLimitState;
  }
}

// Сохраняет состояние лимита попыток входа между перезагрузками страницы.
function writeLoginRateLimitState(state: LoginRateLimitState) {
  window.localStorage.setItem(
    LOGIN_RATE_LIMIT_STORAGE_KEY,
    JSON.stringify(state),
  );
}

// Регистрирует неудачную попытку входа и включает cooldown при превышении лимита.
function recordFailedLoginAttempt() {
  const currentTime = Date.now();
  const currentState = readLoginRateLimitState();

  if (currentState.lockedUntil > currentTime) {
    return currentState;
  }

  const isWithinWindow =
    currentState.windowStartedAt > 0 &&
    currentTime - currentState.windowStartedAt < LOGIN_RATE_LIMIT_WINDOW_MS;
  const nextAttempts = isWithinWindow ? currentState.attempts + 1 : 1;
  const nextState = {
    attempts: nextAttempts,
    windowStartedAt: isWithinWindow ? currentState.windowStartedAt : currentTime,
    lockedUntil:
      nextAttempts >= LOGIN_RATE_LIMIT_MAX_ATTEMPTS
        ? currentTime + LOGIN_RATE_LIMIT_LOCK_MS
        : 0,
  };

  writeLoginRateLimitState(nextState);
  return nextState;
}

// Сбрасывает счетчик попыток после успешного входа продавца.
function resetLoginRateLimitState(
  setLoginRateLimit: (state: LoginRateLimitState) => void,
) {
  window.localStorage.removeItem(LOGIN_RATE_LIMIT_STORAGE_KEY);
  setLoginRateLimit(initialLoginRateLimitState);
}

// Формирует локализованное сообщение о временной блокировке входа.
function getLoginRateLimitMessage(
  cooldownMs: number,
  t: (key: string) => string,
) {
  return `${t("errorLoginRateLimited")} ${formatCooldown(cooldownMs)}.`;
}

// Форматирует оставшееся время блокировки в короткий вид.
function formatCooldown(cooldownMs: number) {
  const totalSeconds = Math.max(1, Math.ceil(cooldownMs / 1_000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  if (minutes === 0) {
    return `${seconds}s`;
  }

  return `${minutes}m ${seconds.toString().padStart(2, "0")}s`;
}

// Превращает известные backend-ошибки на английском в локализованные сообщения.
function getLocalizedAuthError(
  error: unknown,
  t: (key: string) => string,
  fallback: string,
) {
  if (!(error instanceof Error)) {
    return fallback;
  }

  const normalizedMessage = error.message.trim().toLowerCase();
  const messageMap: Record<string, string> = {
    "invalid credentials": "errorInvalidCredentials",
    "invalid reset code": "errorInvalidVerificationCode",
    "invalid verification code": "errorInvalidVerificationCode",
    "invalid or expired reset code": "errorInvalidVerificationCode",
    "invalid or expired verification code": "errorInvalidVerificationCode",
  };
  const translationKey = messageMap[normalizedMessage];

  return translationKey ? t(translationKey) : error.message;
}
