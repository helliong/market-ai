"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Check, LockKeyhole, Mail, Store, User } from "lucide-react";
import { ADMIN_LOGIN_URL, ADMIN_REGISTER_URL, ADMIN_SELLER_URL } from "@/lib/admin";
import { login, register } from "@/store/authSlice";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  hydrateShoppingState,
  persistLocalShoppingState,
} from "@/store/shoppingHydration";

import {
  getCurrentUser,
  loginClient,
  registerClient,
  requestClientPasswordReset,
  resetClientPassword,
  verifyClientPasswordResetCode,
  verifyClientEmail,
} from "@/lib/auth-api";
import { useLanguage } from "@/hooks/useLanguage";

type AuthPageProps = {
  mode: "login" | "register";
  audience?: "client" | "seller";
};

type AuthUser = {
  name: string;
  email: string;
};

type ResetPasswordStep = "email" | "code" | "password";

const CYRILLIC_PATTERN = /\p{Script=Cyrillic}/u;
const LOGIN_RATE_LIMIT_STORAGE_KEY = "marketai.client.loginRateLimit";
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

// Универсальная auth-страница: вход, регистрация, подтверждение email и сброс пароля.
export function AuthPage({ mode, audience = "client" }: AuthPageProps) {
  const { t, lang } = useLanguage();
  const router = useRouter();
  const searchParams = useSearchParams();
  const dispatch = useAppDispatch();
  const cartState = useAppSelector((state) => state.cart);
  const favoritesState = useAppSelector((state) => state.favorites);
  const compareState = useAppSelector((state) => state.compare);
  const isRegister = mode === "register";
  const isSeller = audience === "seller";
  const redirectPath = getSafeRedirectPath(searchParams.get("redirect"));
  const authTheme = isSeller
    ? {
        accentText: "text-[#F59E0B]",
        accentTextHover: "text-[#F59E0B] transition hover:text-[#D97706]",
        primaryButton:
          "bg-[#F59E0B] text-[#111827] transition hover:bg-[#D97706]",
        outlineButton:
          "border border-[#F59E0B] bg-white text-[#B45309] transition hover:bg-[#FFFBEB] hover:text-[#92400E]",
        checked: "border-[#F59E0B] bg-[#F59E0B] text-[#111827]",
        focusBorder: "focus-within:border-[#F59E0B]",
        hoverBorder: "hover:border-[#F59E0B]",
      }
    : {
        accentText: "text-[#6D4AFF]",
        accentTextHover: "text-[#6D4AFF] transition hover:text-[#4F32D9]",
        primaryButton: "bg-[#6D4AFF] text-white transition hover:bg-[#4F32D9]",
        outlineButton:
          "border border-[#6D4AFF] bg-white text-[#6D4AFF] transition hover:bg-[#F4F0FF] hover:text-[#4F32D9]",
        checked: "border-[#6D4AFF] bg-[#6D4AFF] text-white",
        focusBorder: "focus-within:border-[#6D4AFF]",
        hoverBorder: "hover:border-[#6D4AFF]",
      };
  const alternateAuthHref = isSeller
    ? isRegister
      ? ADMIN_LOGIN_URL
      : ADMIN_REGISTER_URL
    : isRegister
      ? buildAuthHref("/login", redirectPath)
      : buildAuthHref("/register", redirectPath);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isAgreementAccepted, setIsAgreementAccepted] = useState(false);
  const [pendingUser, setPendingUser] = useState<AuthUser | null>(null);
  const [verificationCode, setVerificationCode] = useState("");
  const [verificationError, setVerificationError] = useState<string>();
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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string>();
  const [loginRateLimit, setLoginRateLimit] =
    useState<LoginRateLimitState>(initialLoginRateLimitState);
  const [now, setNow] = useState(0);
  const [errors, setErrors] = useState<{
    name?: string;
    email?: string;
    password?: string;
    confirmPassword?: string;
    agreement?: string;
  }>({});
  const isEmailVerificationStep = Boolean(pendingUser);
  const isPasswordResetStep = Boolean(resetPasswordStep);
  const loginCooldownMs =
    !isRegister && loginRateLimit.lockedUntil > now
      ? loginRateLimit.lockedUntil - now
      : 0;
  const isLoginRateLimited = loginCooldownMs > 0;

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setNow(Date.now());
      setLoginRateLimit(readLoginRateLimitState());
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, []);

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
    if (CYRILLIC_PATTERN.test(value)) return t("errorEmailNoCyrillic");
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
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const currentTime = Date.now();

    if (!isRegister && loginRateLimit.lockedUntil > currentTime) {
      setNow(currentTime);
      setSubmitError(undefined);
      return;
    }

    const nextErrors: typeof errors = {};
    const trimmedName = name.trim();
    const trimmedEmail = email.trim();
    const trimmedPassword = password.trim();
    const trimmedConfirmPassword = confirmPassword.trim();

    if (isRegister && !trimmedName) {
      nextErrors.name = t("errorNameRequired");
    }

    const emailError = validateEmail(trimmedEmail);
    if (emailError) {
      nextErrors.email = emailError;
    }

    if (!trimmedPassword) {
      nextErrors.password = t("errorPasswordRequired");
    } else if (CYRILLIC_PATTERN.test(trimmedPassword)) {
      nextErrors.password = t("errorPasswordNoCyrillic");
    } else if (trimmedPassword.length < 6) {
      nextErrors.password = t("errorPasswordMinLength");
    }

    if (isRegister && !trimmedConfirmPassword) {
      nextErrors.confirmPassword = t("errorConfirmPasswordRequired");
    } else if (isRegister && CYRILLIC_PATTERN.test(trimmedConfirmPassword)) {
      nextErrors.confirmPassword = t("errorPasswordNoCyrillic");
    } else if (isRegister && trimmedPassword !== trimmedConfirmPassword) {
      nextErrors.confirmPassword = t("errorPasswordsDoNotMatch");
    }

    if (isRegister && !isAgreementAccepted) {
      nextErrors.agreement = t("errorAgreementRequired");
    }

    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    const fallbackName = trimmedEmail.split("@")[0] || "Пользователь";
    const user = {
      name: isRegister ? trimmedName : fallbackName,
      email: trimmedEmail,
    };

    setIsSubmitting(true);
    setSubmitError(undefined);

    let isLoginRequestSuccessful = false;

    try {
      if (isRegister) {
        await registerClient({
          name: trimmedName,
          email: trimmedEmail,
          password: trimmedPassword,
        });

        setPendingUser(user);
        setVerificationCode("");
        setVerificationError(undefined);
        return;
      }

      await loginClient({
        email: trimmedEmail,
        password: trimmedPassword,
      });
      isLoginRequestSuccessful = true;

      resetLoginRateLimitState(setLoginRateLimit);

      await persistLocalShoppingState({
        cart: cartState,
        favorites: favoritesState,
        compare: compareState,
      });

      const currentUser = await getCurrentUser();

      dispatch(
        login({
          id: currentUser.id,
          name: currentUser.name ?? currentUser.displayName ?? user.name,
          email: currentUser.email,
          isEmailVerified: currentUser.isEmailVerified,
        }),
      );

      await hydrateShoppingState(dispatch).catch(() => undefined);

      router.push(redirectPath ?? "/profile");
    } catch (error) {
      let isRateLimited = false;

      if (!isRegister && !isLoginRequestSuccessful) {
        const nextRateLimit = recordFailedLoginAttempt();
        const currentTime = Date.now();
        setLoginRateLimit(nextRateLimit);
        setNow(currentTime);

        if (nextRateLimit.lockedUntil > currentTime) {
          isRateLimited = true;
        }
      }

      setSubmitError(
        isRateLimited
          ? undefined
          : getLocalizedAuthError(error, t, t("errorAuthRequestFailed")),
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleEmailVerificationSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    if (!pendingUser) {
      return;
    }

    setIsSubmitting(true);
    setVerificationError(undefined);

    try {
      await verifyClientEmail({
        email: pendingUser.email,
        code: verificationCode,
      });

      await loginClient({
        email: pendingUser.email,
        password,
      });

      await persistLocalShoppingState({
        cart: cartState,
        favorites: favoritesState,
        compare: compareState,
      });

      const currentUser = await getCurrentUser();

      dispatch(
        register({
          id: currentUser.id,
          name: currentUser.name ?? currentUser.displayName ?? pendingUser.name,
          email: currentUser.email,
          isEmailVerified: currentUser.isEmailVerified,
        }),
      );

      await hydrateShoppingState(dispatch).catch(() => undefined);

      router.push(redirectPath ?? "/profile");
    } catch (error) {
      setVerificationError(
        getLocalizedAuthError(error, t, t("errorEmailVerificationFailed")),
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleResetPasswordSubmit(event: FormEvent<HTMLFormElement>) {
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

      setIsSubmitting(true);
      setSubmitError(undefined);

      try {
        await requestClientPasswordReset({ email: trimmedEmail });
        setResetEmail(trimmedEmail);
        setResetPasswordStep("code");
        setResetCode("");
        setResetNotice(`${t("resetPasswordEmailSent")} ${trimmedEmail}.`);
      } catch (error) {
        setSubmitError(
          getLocalizedAuthError(error, t, t("errorPasswordResetFailed")),
        );
      } finally {
        setIsSubmitting(false);
      }
      return;
    }

    if (resetPasswordStep === "code") {
      if (resetCode.length !== 6) {
        nextErrors.code = t("errorVerificationCodeRequired");
      }

      setResetErrors(nextErrors);

      if (nextErrors.code) {
        return;
      }

      setIsSubmitting(true);
      setSubmitError(undefined);

      try {
        await verifyClientPasswordResetCode({
          email: resetEmail,
          code: resetCode,
        });
        setResetPasswordStep("password");
        setResetNotice(t("resetCodeAccepted"));
      } catch (error) {
        setResetErrors({
          code:
            getLocalizedAuthError(error, t, t("errorInvalidVerificationCode")),
        });
      } finally {
        setIsSubmitting(false);
      }
      return;
    }

    const trimmedPassword = resetPassword.trim();
    const trimmedConfirmPassword = resetConfirmPassword.trim();

    if (!trimmedPassword) {
      nextErrors.password = t("errorPasswordRequired");
    } else if (CYRILLIC_PATTERN.test(trimmedPassword)) {
      nextErrors.password = t("errorPasswordNoCyrillic");
    } else if (trimmedPassword.length < 6) {
      nextErrors.password = t("errorPasswordMinLength");
    }

    if (!trimmedConfirmPassword) {
      nextErrors.confirmPassword = t("errorConfirmPasswordRequired");
    } else if (trimmedPassword !== trimmedConfirmPassword) {
      nextErrors.confirmPassword = t("errorPasswordsDoNotMatch");
    }

    setResetErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    setIsSubmitting(true);
    setSubmitError(undefined);

    try {
      await resetClientPassword({
        email: resetEmail,
        code: resetCode,
        password: trimmedPassword,
      });
      setPassword("");
      setEmail(resetEmail);
      resetPasswordFlow();
      setSubmitError(undefined);
    } catch (error) {
      setSubmitError(
        getLocalizedAuthError(error, t, t("errorPasswordResetFailed")),
      );
    } finally {
      setIsSubmitting(false);
    }
  }


  return (
    <section className="mx-auto grid min-h-[calc(100vh-76px)] max-w-[1440px] grid-cols-1 gap-8 px-4 py-8 md:px-8 md:py-10 lg:grid-cols-[1fr_460px] lg:gap-10">
      <div className="flex items-center">
        <div className="max-w-[620px]">
          <p className={`text-sm font-black uppercase tracking-[0.16em] ${authTheme.accentText}`}>
            {isSeller ? t("marketAIForSellers") : t("marketAIAccount")}
          </p>
          <h1 className="mt-4 text-3xl font-black leading-tight tracking-[-0.05em] md:text-5xl">
            {isSeller
              ? isRegister ? t("createSellerAccount") : t("loginSellerAccount")
              : isRegister ? t("createProfile") : t("loginProfile")}
          </h1>
          <p className="mt-5 max-w-[520px] text-lg leading-8 text-[#6B7280]">
            {isSeller
              ? isRegister ? t("sellerRegisterDesc") : t("sellerLoginDesc")
              : isRegister ? t("clientRegisterDesc") : t("clientLoginDesc")}
          </p>
          <div className="mt-8 hidden max-w-[560px] grid-cols-1 gap-3 sm:grid-cols-3 lg:grid">
            {(isSeller ? t("sellerFeatures") : t("clientFeatures")).split(',').map((item, idx) => (
              <div key={idx} className="rounded-2xl bg-white p-4 text-sm font-bold text-[#111827] shadow-[0_8px_24px_rgba(15,23,42,0.06)]">
                {item.trim()}
              </div>
           ))}
          </div>
        </div>
      </div>

      <form
        noValidate
        onSubmit={isPasswordResetStep ? handleResetPasswordSubmit : isEmailVerificationStep ? handleEmailVerificationSubmit : handleSubmit}
        className="self-center rounded-[32px] bg-white p-6 shadow-[0_18px_50px_rgba(15,23,42,0.10)]"
      >
        <div className="mb-6">
          <h2 className="text-2xl font-black tracking-[-0.03em]">
            {isEmailVerificationStep ? t("emailVerification") : isPasswordResetStep ? t("resetPassword") : isRegister ? t("registration") : t("loginForm")}
          </h2>
          <p className="mt-2 text-sm text-[#6B7280]">
            {isEmailVerificationStep
              ? `${t("codeSentTo")} ${pendingUser?.email}`
              : isPasswordResetStep
              ? resetPasswordStep === "email"
                ? t("enterEmailToReset")
                : resetPasswordStep === "code"
                ? t("enterSixDigits")
                : t("enterNewPassword")
              : isRegister
              ? t("fillData")
              : t("enterEmailPassword")}
          </p>
        </div>

        {isPasswordResetStep ? (
          <div className="space-y-4">
            {resetNotice && <p className="auth-reset-notice rounded-2xl border px-4 py-3 text-sm font-bold">{resetNotice}</p>}
            {resetPasswordStep === "email" && (
              <AuthField
                icon={<Mail size={18} />} label="Email" value={resetEmail}
                onChange={(value) => { setResetEmail(value); setResetErrors({ ...resetErrors, email: undefined }); }}
                placeholder="you@example.com" type="email" error={resetErrors.email} focusBorder={authTheme.focusBorder}
              />
            )}
            {resetPasswordStep === "code" && (
              <AuthField
                icon={<Mail size={18} />} label="Код из письма" value={resetCode}
                onChange={(value) => { setResetCode(value.replace(/\D/g, "").slice(0, 6)); setResetErrors({ ...resetErrors, code: undefined }); }}
                placeholder="000000" type="text" error={resetErrors.code} focusBorder={authTheme.focusBorder}
              />
            )}
            {resetPasswordStep === "password" && (
              <>
                <AuthField
                  icon={<LockKeyhole size={18} />} label={t("newPassword")} value={resetPassword}
                  onChange={(value) => { setResetPassword(value); setResetErrors({ ...resetErrors, password: undefined, confirmPassword: undefined }); }}
                  placeholder="Введите новый пароль" type="password" error={resetErrors.password} focusBorder={authTheme.focusBorder}
                />
                <AuthField
                  icon={<LockKeyhole size={18} />} label={t("confirmPassword")} value={resetConfirmPassword}
                  onChange={(value) => { setResetConfirmPassword(value); setResetErrors({ ...resetErrors, confirmPassword: undefined }); }}
                  placeholder="Повторите новый пароль" type="password" error={resetErrors.confirmPassword} focusBorder={authTheme.focusBorder}
                />
              </>
            )}
            {submitError && <p className="rounded-2xl bg-[#FEF2F2] px-4 py-3 text-sm font-bold text-[#DC2626]">{submitError}</p>}
            <button type="submit" disabled={isSubmitting} className={`flex h-12 w-full items-center justify-center rounded-2xl text-sm font-bold disabled:cursor-not-allowed disabled:opacity-70 ${authTheme.primaryButton}`}>
              {isSubmitting ? "Загрузка..." : resetPasswordStep === "email" ? "Отправить письмо" : resetPasswordStep === "code" ? "Подтвердить код" : t("savePassword")}
            </button>
            <button type="button" onClick={resetPasswordFlow} className={`flex h-12 w-full items-center justify-center rounded-2xl text-sm font-bold ${authTheme.outlineButton}`}>
              {t("backToLogin")}
            </button>
          </div>
        ) : isEmailVerificationStep ? (
          <div className="space-y-4">
            <AuthField
              icon={<Mail size={18} />} label={t("verificationCode")} value={verificationCode}
              onChange={(value) => { setVerificationCode(value.replace(/\D/g, "").slice(0, 6)); setVerificationError(undefined); }}
              placeholder="000000" type="text" error={verificationError} focusBorder={authTheme.focusBorder}
            />
            <button type="submit" disabled={isSubmitting} className={`flex h-12 w-full items-center justify-center rounded-2xl text-sm font-bold disabled:cursor-not-allowed disabled:opacity-70 ${authTheme.primaryButton}`}>
              {isSubmitting ? "Загрузка..." : t("confirmEmail")}
            </button>
            <button type="button" onClick={() => { setPendingUser(null); setVerificationCode(""); setVerificationError(undefined); }} className={`flex h-12 w-full items-center justify-center rounded-2xl text-sm font-bold ${authTheme.outlineButton}`}>
              {t("resendCode")}
            </button>
            <button type="button" onClick={() => { setPendingUser(null); setVerificationCode(""); setVerificationError(undefined); }} className={`flex h-12 w-full items-center justify-center rounded-2xl text-sm font-bold ${authTheme.outlineButton}`}>
              {t("changeData")}
            </button>
          </div>
        ) : (
          <>
            <div className="space-y-4">
              {isRegister && (
                <AuthField
                  icon={<User size={18} />} label={isSeller ? t("storeName") : t("name")} value={name}
                  onChange={(value) => { setName(value); setErrors({ ...errors, name: undefined }); }}
                  placeholder={isSeller ? "Market store" : "George"} type="text" error={errors.name} focusBorder={authTheme.focusBorder}
                />
              )}
              <AuthField
                icon={<Mail size={18} />} label="Email" value={email}
                onChange={(value) => { setEmail(value); setErrors({ ...errors, email: undefined }); }}
                placeholder="you@example.com" type="email" error={errors.email} focusBorder={authTheme.focusBorder}
              />
              <AuthField
                icon={<LockKeyhole size={18} />} label="Пароль" value={password}
                onChange={(value) => { setPassword(value); setErrors({ ...errors, password: undefined, confirmPassword: undefined }); }}
                placeholder="Введите пароль" type="password" error={errors.password} focusBorder={authTheme.focusBorder}
              />
              {isRegister && (
                <AuthField
                  icon={<LockKeyhole size={18} />} label={t("confirmPassword")} value={confirmPassword}
                  onChange={(value) => { setConfirmPassword(value); setErrors({ ...errors, confirmPassword: undefined }); }}
                  placeholder="Повторите пароль" type="password" error={errors.confirmPassword} focusBorder={authTheme.focusBorder}
                />
              )}
              {isRegister && (
                <label className="block">
                  <span className={`flex items-start gap-3 rounded-2xl border border-[#E5E7EB] bg-[#F9FAFB] p-4 transition ${authTheme.hoverBorder}`}>
                    <span className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition ${isAgreementAccepted ? authTheme.checked : "border-[#D1D5DB] bg-white text-transparent"}`}>
                      <Check size={14} />
                    </span>
                    <input type="checkbox" checked={isAgreementAccepted} onChange={(e) => { setIsAgreementAccepted(e.target.checked); setErrors({ ...errors, agreement: undefined }); }} className="sr-only" />
                    <span className="text-sm font-semibold leading-6 text-[#6B7280]">
                      {t("iAccept")} <Link href="/agreement" className={`font-black ${authTheme.accentTextHover}`}>{t("userAgreement")}</Link>
                    </span>
                  </span>
                  {errors.agreement && <span className="mt-2 block text-sm font-bold text-[#EF4444]">{errors.agreement}</span>}
                </label>
              )}
            </div>
            {submitError && !isLoginRateLimited && <p className="mt-4 rounded-2xl bg-[#FEF2F2] px-4 py-3 text-sm font-bold text-[#EF4444]">{submitError}</p>}
            {isLoginRateLimited && (
              <p className="auth-login-rate-notice mt-4 rounded-2xl px-4 py-3 text-sm font-bold">
                {getLoginRateLimitMessage(
                  loginCooldownMs,
                  lang,
                )}
              </p>
            )}
            <button type="submit" disabled={isSubmitting || isLoginRateLimited} className={`mt-6 flex h-12 w-full items-center justify-center rounded-2xl text-sm font-bold disabled:cursor-not-allowed disabled:opacity-70 ${authTheme.primaryButton}`}>
              {isSubmitting ? "Загрузка..." : isRegister ? t("registerNow") : t("login")}
            </button>
            <p className="mt-5 text-center text-sm text-[#6B7280]">
              {isRegister ? t("alreadyHaveAccount") : t("noAccountYet")}{" "}
              <Link href={alternateAuthHref} className={`font-black ${authTheme.accentTextHover}`}>
                {isRegister ? t("login") : t("registerNow")}
              </Link>
            </p>
            {!isRegister && (
              <button type="button" onClick={() => { setResetPasswordStep("email"); setResetEmail(email); setResetCode(""); setResetPassword(""); setResetConfirmPassword(""); setResetNotice(undefined); setResetErrors({}); setSubmitError(undefined); }} className={`mx-auto mt-3 block w-fit text-sm font-black ${authTheme.accentTextHover}`}>
                {t("forgotPassword")}
              </button>
            )}
            {isRegister && !isSeller && (
              <a href={ADMIN_SELLER_URL} className="seller-profile-cta relative mt-4 flex h-12 items-center justify-center gap-2 overflow-visible rounded-2xl border border-[#6D4AFF] bg-white text-sm font-black text-[#6D4AFF] transition hover:bg-[#F4F0FF] hover:text-[#4F32D9]">
                <span className="seller-profile-cta-star seller-profile-cta-star-1" aria-hidden="true" />
                <span className="seller-profile-cta-star seller-profile-cta-star-2" aria-hidden="true" />
                <span className="seller-profile-cta-star seller-profile-cta-star-3" aria-hidden="true" />
                <span className="seller-profile-cta-star seller-profile-cta-star-4" aria-hidden="true" />
                <Store size={18} />
                {t("sellOnMarketAI")}
              </a>
            )}
          </>
        )}
      </form>
    </section>
  );
}

// Проверяет redirect-путь, чтобы не допустить внешние или небезопасные URL.
function getSafeRedirectPath(value: string | null) {
  if (!value || !value.startsWith("/") || value.startsWith("//")) {
    return null;
  }

  return value;
}

// Собирает ссылку на auth-страницу и сохраняет redirect-параметр, если он есть.
function buildAuthHref(path: string, redirectPath: string | null) {
  if (!redirectPath) {
    return path;
  }

  return `${path}?redirect=${encodeURIComponent(redirectPath)}`;
}

// Превращает известные backend-ошибки на английском в локализованные сообщения интерфейса.
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

// Читает сохраненное состояние лимита попыток входа из localStorage.
function readLoginRateLimitState(): LoginRateLimitState {
  if (typeof window === "undefined") {
    return initialLoginRateLimitState;
  }

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

// Регистрирует неудачную попытку входа и при необходимости включает cooldown.
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

// Сбрасывает счетчик попыток после успешного входа пользователя.
function resetLoginRateLimitState(
  setLoginRateLimit: (state: LoginRateLimitState) => void,
) {
  window.localStorage.removeItem(LOGIN_RATE_LIMIT_STORAGE_KEY);
  setLoginRateLimit(initialLoginRateLimitState);
}

// Формирует локализованное сообщение о временной блокировке входа.
function getLoginRateLimitMessage(cooldownMs: number, lang: string) {
  const messages: Record<string, string> = {
    en: "Too many login attempts. Try again in",
    kk: "Кіру әрекеттері тым көп. Қайталап көріңіз",
    ru: "Слишком много попыток входа. Попробуйте снова через",
  };

  return `${messages[lang] ?? messages.ru} ${formatCooldown(cooldownMs)}.`;
}

// Форматирует оставшееся время блокировки в короткий вид для кнопки и notice.
function formatCooldown(cooldownMs: number) {
  const totalSeconds = Math.max(1, Math.ceil(cooldownMs / 1_000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  if (minutes === 0) {
    return `${seconds}s`;
  }

  return `${minutes}m ${seconds.toString().padStart(2, "0")}s`;
}

// Переиспользуемое поле формы авторизации с иконкой, подписью и ошибкой.
function AuthField({
  icon,
  label,
  value,
  onChange,
  placeholder,
  type,
  error,
  focusBorder = "focus-within:border-[#6D4AFF]",
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  type: string;
  error?: string;
  focusBorder?: string;
}) {
  return (
    <label className="block">
      <span className="text-sm font-bold text-[#111827]">{label}</span>
      <span className={`mt-2 flex h-12 items-center gap-3 rounded-2xl border bg-[#F9FAFB] px-4 text-[#6B7280] transition focus-within:bg-white ${error ? "border-[#EF4444] focus-within:border-[#EF4444]" : `border-[#E5E7EB] ${focusBorder}`}`}>
        {icon}
        <input type={type} value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} className="h-full min-w-0 flex-1 bg-transparent text-sm font-semibold text-[#111827] outline-none placeholder:text-[#9CA3AF]" />
      </span>
      {error && <span className="mt-2 block text-sm font-bold text-[#EF4444]">{error}</span>}
    </label>
  );
}
