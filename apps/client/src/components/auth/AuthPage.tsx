"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Check, LockKeyhole, Mail, Store, User } from "lucide-react";
import {
  ADMIN_LOGIN_URL,
  ADMIN_REGISTER_URL,
  ADMIN_SELLER_URL,
} from "@/lib/admin";
import { login, register } from "@/store/authSlice";
import { useAppDispatch } from "@/store/hooks";

import {
  getCurrentUser,
  loginClient,
  registerClient,
  verifyClientEmail,
} from "@/lib/auth-api";

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
const RESET_PASSWORD_MOCK_CODE = "123456";

export function AuthPage({ mode, audience = "client" }: AuthPageProps) {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const isRegister = mode === "register";
  const isSeller = audience === "seller";
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
      ? "/login"
      : "/register";
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
  const [errors, setErrors] = useState<{
    name?: string;
    email?: string;
    password?: string;
    confirmPassword?: string;
    agreement?: string;
  }>({});
  const isEmailVerificationStep = Boolean(pendingUser);
  const isPasswordResetStep = Boolean(resetPasswordStep);

  function validateEmail(value: string) {
    if (!value) {
      return "Введите email";
    }

    if (CYRILLIC_PATTERN.test(value)) {
      return "Email не должен содержать кириллицу";
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

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextErrors: typeof errors = {};
    const trimmedName = name.trim();
    const trimmedEmail = email.trim();
    const trimmedPassword = password.trim();
    const trimmedConfirmPassword = confirmPassword.trim();

    if (isRegister && !trimmedName) {
      nextErrors.name = "Введите имя";
    }

    const emailError = validateEmail(trimmedEmail);
    if (emailError) {
      nextErrors.email = emailError;
    }

    if (!trimmedPassword) {
      nextErrors.password = "Введите пароль";
    } else if (CYRILLIC_PATTERN.test(trimmedPassword)) {
      nextErrors.password = "Пароль не должен содержать кириллицу";
    } else if (trimmedPassword.length < 6) {
      nextErrors.password = "Пароль должен быть не короче 6 символов";
    }

    if (isRegister && !trimmedConfirmPassword) {
      nextErrors.confirmPassword = "Подтвердите пароль";
    } else if (isRegister && CYRILLIC_PATTERN.test(trimmedConfirmPassword)) {
      nextErrors.confirmPassword =
        "Подтверждение пароля не должно содержать кириллицу";
    } else if (isRegister && trimmedPassword !== trimmedConfirmPassword) {
      nextErrors.confirmPassword = "Пароли не совпадают";
    }

    if (isRegister && !isAgreementAccepted) {
      nextErrors.agreement = "Подтвердите пользовательское соглашение";
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

      const currentUser = await getCurrentUser();

      dispatch(
        login({
          id: currentUser.id,
          name: currentUser.name,
          email: currentUser.email,
          isEmailVerified: currentUser.isEmailVerified,
        }),
      );

      router.push("/profile");
    } catch (error) {
      setSubmitError(
        error instanceof Error ? error.message : "Auth request failed",
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

      const currentUser = await getCurrentUser();

      dispatch(
        register({
          id: currentUser.id,
          name: currentUser.name,
          email: currentUser.email,
          isEmailVerified: currentUser.isEmailVerified,
        }),
      );

      router.push("/profile");
    } catch (error) {
      setVerificationError(
        error instanceof Error ? error.message : "Email verification failed",
      );
    } finally {
      setIsSubmitting(false);
    }
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
    } else if (CYRILLIC_PATTERN.test(trimmedPassword)) {
      nextErrors.password = "Пароль не должен содержать кириллицу";
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

    setPassword(trimmedPassword);
    setEmail(resetEmail);
    setSubmitError(undefined);
    resetPasswordFlow();
  }

  return (
    <section className="mx-auto grid min-h-[calc(100vh-76px)] max-w-[1440px] grid-cols-1 gap-8 px-4 py-8 md:px-8 md:py-10 lg:grid-cols-[1fr_460px] lg:gap-10">
      <div className="flex items-center">
        <div className="max-w-[620px]">
          <p
            className={`text-sm font-black uppercase tracking-[0.16em] ${authTheme.accentText}`}
          >
            {isSeller ? "MarketAI для продавцов" : "MarketAI аккаунт"}
          </p>
          <h1 className="mt-4 text-3xl font-black leading-tight tracking-[-0.05em] md:text-5xl">
            {isSeller
              ? isRegister
                ? "Создайте кабинет продавца"
                : "Войдите в кабинет продавца"
              : isRegister
                ? "Создайте профиль для покупок"
                : "Войдите в профиль"}
          </h1>
          <p className="mt-5 max-w-[520px] text-lg leading-8 text-[#6B7280]">
            {isSeller
              ? isRegister
                ? "Зарегистрируйте продавца, чтобы подготовить витрину, карточки товаров и управление заказами."
                : "Войдите как продавец, чтобы продолжить работу с витриной и заказами."
              : isRegister
                ? "Регистрация пока работает на фронтенде: мы сохраним пользователя в состоянии приложения, а бэк подключим позже."
                : "Вход пока без серверной проверки. После отправки формы вы попадете в профиль как авторизованный пользователь."}
          </p>

          <div className="mt-8 hidden max-w-[560px] grid-cols-1 gap-3 sm:grid-cols-3 lg:grid">
            {(isSeller
              ? ["Своя витрина", "Карточки товаров", "Заказы в работе"]
              : ["Быстрее оформление", "Избранное под рукой", "История заказов"]
            ).map((item) => (
              <div
                key={item}
                className="rounded-2xl bg-white p-4 text-sm font-bold text-[#111827] shadow-[0_8px_24px_rgba(15,23,42,0.06)]"
              >
                {item}
              </div>
            ))}
          </div>
        </div>
      </div>

      <form
        noValidate
        onSubmit={
          isPasswordResetStep
            ? handleResetPasswordSubmit
            : isEmailVerificationStep
              ? handleEmailVerificationSubmit
              : handleSubmit
        }
        className="self-center rounded-[32px] bg-white p-6 shadow-[0_18px_50px_rgba(15,23,42,0.10)]"
      >
        <div className="mb-6">
          <h2 className="text-2xl font-black tracking-[-0.03em]">
            {isEmailVerificationStep
              ? "Подтверждение почты"
              : isPasswordResetStep
                ? "Восстановление пароля"
              : isRegister
                ? "Регистрация"
                : "Вход"}
          </h2>
          <p className="mt-2 text-sm text-[#6B7280]">
            {isEmailVerificationStep
              ? `Введите код, отправленный на ${pendingUser?.email}`
              : isPasswordResetStep
                ? resetPasswordStep === "email"
                  ? "Введите email аккаунта, чтобы получить код"
                  : resetPasswordStep === "code"
                    ? "Введите 6 цифр из письма"
                    : "Придумайте новый пароль"
              : isRegister
                ? "Заполните данные для создания аккаунта"
                : "Введите email и пароль от аккаунта"}
          </p>
        </div>

        {isPasswordResetStep ? (
          <div className="space-y-4">
            {resetNotice && (
              <p className="rounded-2xl bg-[#F4F0FF] px-4 py-3 text-sm font-bold text-[#4F32D9]">
                {resetNotice}
              </p>
            )}

            {resetPasswordStep === "email" && (
              <AuthField
                icon={<Mail size={18} />}
                label="Email"
                value={resetEmail}
                onChange={(value) => {
                  setResetEmail(value);
                  setResetErrors((current) => ({
                    ...current,
                    email: undefined,
                  }));
                }}
                placeholder="you@example.com"
                type="email"
                error={resetErrors.email}
                focusBorder={authTheme.focusBorder}
              />
            )}

            {resetPasswordStep === "code" && (
              <AuthField
                icon={<Mail size={18} />}
                label="Код из письма"
                value={resetCode}
                onChange={(value) => {
                  setResetCode(value.replace(/\D/g, "").slice(0, 6));
                  setResetErrors((current) => ({
                    ...current,
                    code: undefined,
                  }));
                }}
                placeholder="000000"
                type="text"
                error={resetErrors.code}
                focusBorder={authTheme.focusBorder}
              />
            )}

            {resetPasswordStep === "password" && (
              <>
                <AuthField
                  icon={<LockKeyhole size={18} />}
                  label="Новый пароль"
                  value={resetPassword}
                  onChange={(value) => {
                    setResetPassword(value);
                    setResetErrors((current) => ({
                      ...current,
                      password: undefined,
                      confirmPassword: undefined,
                    }));
                  }}
                  placeholder="Введите новый пароль"
                  type="password"
                  error={resetErrors.password}
                  focusBorder={authTheme.focusBorder}
                />

                <AuthField
                  icon={<LockKeyhole size={18} />}
                  label="Подтвердите пароль"
                  value={resetConfirmPassword}
                  onChange={(value) => {
                    setResetConfirmPassword(value);
                    setResetErrors((current) => ({
                      ...current,
                      confirmPassword: undefined,
                    }));
                  }}
                  placeholder="Повторите новый пароль"
                  type="password"
                  error={resetErrors.confirmPassword}
                  focusBorder={authTheme.focusBorder}
                />
              </>
            )}

            <button
              type="submit"
              className={`flex h-12 w-full items-center justify-center rounded-2xl text-sm font-bold ${authTheme.primaryButton}`}
            >
              {resetPasswordStep === "email"
                ? "Отправить письмо"
                : resetPasswordStep === "code"
                  ? "Подтвердить код"
                  : "Сохранить пароль"}
            </button>

            <button
              type="button"
              onClick={resetPasswordFlow}
              className={`flex h-12 w-full items-center justify-center rounded-2xl text-sm font-bold ${authTheme.outlineButton}`}
            >
              Вернуться ко входу
            </button>
          </div>
        ) : isEmailVerificationStep ? (
          <div className="space-y-4">
            <AuthField
              icon={<Mail size={18} />}
              label="Код подтверждения"
              value={verificationCode}
              onChange={(value) => {
                setVerificationCode(value.replace(/\D/g, "").slice(0, 6));
                setVerificationError(undefined);
              }}
              placeholder="000000"
              type="text"
              error={verificationError}
              focusBorder={authTheme.focusBorder}
            />

            <button
              type="submit"
              disabled={isSubmitting}
              className={`flex h-12 w-full items-center justify-center rounded-2xl text-sm font-bold disabled:cursor-not-allowed disabled:opacity-70 ${authTheme.primaryButton}`}
            >
              {isSubmitting ? "Загрузка..." : "Подтвердить email"}
            </button>

            <button
              type="button"
              onClick={() => {
                setPendingUser(null);
                setVerificationCode("");
                setVerificationError(undefined);
              }}
              className={`flex h-12 w-full items-center justify-center rounded-2xl text-sm font-bold ${authTheme.outlineButton}`}
            >
              Отправить код еще раз
            </button>

            <button
              type="button"
              onClick={() => {
                setPendingUser(null);
                setVerificationCode("");
                setVerificationError(undefined);
              }}
              className={`flex h-12 w-full items-center justify-center rounded-2xl text-sm font-bold ${authTheme.outlineButton}`}
            >
              Изменить данные
            </button>
          </div>
        ) : (
          <>
            <div className="space-y-4">
              {isRegister && (
                <AuthField
                  icon={<User size={18} />}
                  label={isSeller ? "Название магазина" : "Имя"}
                  value={name}
                  onChange={(value) => {
                    setName(value);
                    setErrors((current) => ({ ...current, name: undefined }));
                  }}
                  placeholder={isSeller ? "Market store" : "George"}
                  type="text"
                  error={errors.name}
                  focusBorder={authTheme.focusBorder}
                />
              )}

              <AuthField
                icon={<Mail size={18} />}
                label="Email"
                value={email}
                onChange={(value) => {
                  setEmail(value);
                  setErrors((current) => ({ ...current, email: undefined }));
                }}
                placeholder="you@example.com"
                type="email"
                error={errors.email}
                focusBorder={authTheme.focusBorder}
              />

              <AuthField
                icon={<LockKeyhole size={18} />}
                label="Пароль"
                value={password}
                onChange={(value) => {
                  setPassword(value);
                  setErrors((current) => ({
                    ...current,
                    password: undefined,
                    confirmPassword: undefined,
                  }));
                }}
                placeholder="Введите пароль"
                type="password"
                error={errors.password}
                focusBorder={authTheme.focusBorder}
              />

              {isRegister && (
                <AuthField
                  icon={<LockKeyhole size={18} />}
                  label="Подтвердите пароль"
                  value={confirmPassword}
                  onChange={(value) => {
                    setConfirmPassword(value);
                    setErrors((current) => ({
                      ...current,
                      confirmPassword: undefined,
                    }));
                  }}
                  placeholder="Повторите пароль"
                  type="password"
                  error={errors.confirmPassword}
                  focusBorder={authTheme.focusBorder}
                />
              )}

              {isRegister && (
                <label className="block">
                  <span
                    className={`flex items-start gap-3 rounded-2xl border border-[#E5E7EB] bg-[#F9FAFB] p-4 transition ${authTheme.hoverBorder}`}
                  >
                    <span
                      className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition ${
                        isAgreementAccepted
                          ? authTheme.checked
                          : "border-[#D1D5DB] bg-white text-transparent"
                      }`}
                    >
                      <Check size={14} />
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
                      className="sr-only"
                    />
                    <span className="text-sm font-semibold leading-6 text-[#6B7280]">
                      Я принимаю{" "}
                      <Link
                        href="/agreement"
                        className={`font-black ${authTheme.accentTextHover}`}
                      >
                        пользовательское соглашение
                      </Link>
                    </span>
                  </span>
                  {errors.agreement && (
                    <span className="mt-2 block text-sm font-bold text-[#EF4444]">
                      {errors.agreement}
                    </span>
                  )}
                </label>
              )}
            </div>

            {submitError && (
              <p className="mt-4 rounded-2xl bg-[#FEF2F2] px-4 py-3 text-sm font-bold text-[#EF4444]">
                {submitError}
              </p>
            )}
            <button
              type="submit"
              disabled={isSubmitting}
              className={`mt-6 flex h-12 w-full items-center justify-center rounded-2xl text-sm font-bold disabled:cursor-not-allowed disabled:opacity-70 ${authTheme.primaryButton}`}
            >
              {isSubmitting
                ? "Загрузка..."
                : isRegister
                  ? "Зарегистрироваться"
                  : "Войти"}
            </button>

            <p className="mt-5 text-center text-sm text-[#6B7280]">
              {isRegister ? "Уже есть аккаунт?" : "Еще нет аккаунта?"}{" "}
              <Link
                href={alternateAuthHref}
                className={`font-black ${authTheme.accentTextHover}`}
              >
                {isRegister ? "Войти" : "Зарегистрироваться"}
              </Link>
            </p>

            {!isRegister && (
              <button
                type="button"
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
                className={`mx-auto mt-3 block w-fit text-sm font-black ${authTheme.accentTextHover}`}
              >
                Забыли пароль?
              </button>
            )}

            {isRegister && !isSeller && (
              <a
                href={ADMIN_SELLER_URL}
                className="seller-profile-cta relative mt-4 flex h-12 items-center justify-center gap-2 overflow-visible rounded-2xl border border-[#6D4AFF] bg-white text-sm font-black text-[#6D4AFF] transition hover:bg-[#F4F0FF] hover:text-[#4F32D9]"
              >
                <span
                  className="seller-profile-cta-star seller-profile-cta-star-1"
                  aria-hidden="true"
                />
                <span
                  className="seller-profile-cta-star seller-profile-cta-star-2"
                  aria-hidden="true"
                />
                <span
                  className="seller-profile-cta-star seller-profile-cta-star-3"
                  aria-hidden="true"
                />
                <span
                  className="seller-profile-cta-star seller-profile-cta-star-4"
                  aria-hidden="true"
                />
                <Store size={18} />
                Продавайте на MarketAI
              </a>
            )}
          </>
        )}
      </form>
    </section>
  );
}

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
      <span
        className={`mt-2 flex h-12 items-center gap-3 rounded-2xl border bg-[#F9FAFB] px-4 text-[#6B7280] transition focus-within:bg-white ${
          error
            ? "border-[#EF4444] focus-within:border-[#EF4444]"
            : `border-[#E5E7EB] ${focusBorder}`
        }`}
      >
        {icon}
        <input
          type={type}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          className="h-full min-w-0 flex-1 bg-transparent text-sm font-semibold text-[#111827] outline-none placeholder:text-[#9CA3AF]"
        />
      </span>
      {error && (
        <span className="mt-2 block text-sm font-bold text-[#EF4444]">
          {error}
        </span>
      )}
    </label>
  );
}
