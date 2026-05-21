"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { LockKeyhole, Mail, User } from "lucide-react";
import { login, register } from "@/store/authSlice";
import { useAppDispatch } from "@/store/hooks";

type AuthPageProps = {
  mode: "login" | "register";
};

export function AuthPage({ mode }: AuthPageProps) {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const isRegister = mode === "register";
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<{
    name?: string;
    email?: string;
    password?: string;
  }>({});

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextErrors: typeof errors = {};
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

    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    const fallbackName = trimmedEmail.split("@")[0] || "Пользователь";
    const user = {
      name: isRegister ? trimmedName : fallbackName,
      email: trimmedEmail,
    };

    dispatch(isRegister ? register(user) : login(user));
    router.push("/profile");
  }

  return (
    <section className="mx-auto grid min-h-[calc(100vh-76px)] max-w-[1440px] grid-cols-[1fr_460px] gap-10 px-8 py-10">
      <div className="flex items-center">
        <div className="max-w-[620px]">
          <p className="text-sm font-black uppercase tracking-[0.16em] text-[#6D4AFF]">
            MarketAI аккаунт
          </p>
          <h1 className="mt-4 text-5xl font-black leading-tight tracking-[-0.05em]">
            {isRegister ? "Создайте профиль для покупок" : "Войдите в профиль"}
          </h1>
          <p className="mt-5 max-w-[520px] text-lg leading-8 text-[#6B7280]">
            {isRegister
              ? "Регистрация пока работает на фронтенде: мы сохраним пользователя в состоянии приложения, а бэк подключим позже."
              : "Вход пока без серверной проверки. После отправки формы вы попадете в профиль как авторизованный пользователь."}
          </p>

          <div className="mt-8 grid max-w-[560px] grid-cols-3 gap-3">
            {["Быстрее оформление", "Избранное под рукой", "История заказов"].map(
              (item) => (
                <div
                  key={item}
                  className="rounded-2xl bg-white p-4 text-sm font-bold text-[#111827] shadow-[0_8px_24px_rgba(15,23,42,0.06)]"
                >
                  {item}
                </div>
              ),
            )}
          </div>
        </div>
      </div>

      <form
        noValidate
        onSubmit={handleSubmit}
        className="self-center rounded-[32px] bg-white p-6 shadow-[0_18px_50px_rgba(15,23,42,0.10)]"
      >
        <div className="mb-6">
          <h2 className="text-2xl font-black tracking-[-0.03em]">
            {isRegister ? "Регистрация" : "Вход"}
          </h2>
          <p className="mt-2 text-sm text-[#6B7280]">
            {isRegister
              ? "Заполните данные для создания аккаунта"
              : "Введите email и пароль от аккаунта"}
          </p>
        </div>

        <div className="space-y-4">
          {isRegister && (
            <AuthField
              icon={<User size={18} />}
              label="Имя"
              value={name}
              onChange={(value) => {
                setName(value);
                setErrors((current) => ({ ...current, name: undefined }));
              }}
              placeholder="George"
              type="text"
              error={errors.name}
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
          />

          <AuthField
            icon={<LockKeyhole size={18} />}
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
        </div>

        <button
          type="submit"
          className="mt-6 flex h-12 w-full items-center justify-center rounded-2xl bg-[#6D4AFF] text-sm font-bold text-white transition hover:bg-[#4F32D9]"
        >
          {isRegister ? "Зарегистрироваться" : "Войти"}
        </button>

        <p className="mt-5 text-center text-sm text-[#6B7280]">
          {isRegister ? "Уже есть аккаунт?" : "Еще нет аккаунта?"}{" "}
          <Link
            href={isRegister ? "/login" : "/register"}
            className="font-black text-[#6D4AFF] transition hover:text-[#4F32D9]"
          >
            {isRegister ? "Войти" : "Зарегистрироваться"}
          </Link>
        </p>
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
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  type: string;
  error?: string;
}) {
  return (
    <label className="block">
      <span className="text-sm font-bold text-[#111827]">{label}</span>
      <span
        className={`mt-2 flex h-12 items-center gap-3 rounded-2xl border bg-[#F9FAFB] px-4 text-[#6B7280] transition focus-within:bg-white ${
          error
            ? "border-[#EF4444] focus-within:border-[#EF4444]"
            : "border-[#E5E7EB] focus-within:border-[#6D4AFF]"
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
      {error && <span className="mt-2 block text-sm font-bold text-[#EF4444]">{error}</span>}
    </label>
  );
}
