import { Suspense } from "react";
import { AuthPage } from "@/components/auth/AuthPage";
import { Header } from "@/components/layout/Header";

// Страница регистрации показывает форму создания аккаунта покупателя.
export default function Register() {
  return (
    <main>
      <Header />
      <Suspense>
        <AuthPage mode="register" />
      </Suspense>
    </main>
  );
}
