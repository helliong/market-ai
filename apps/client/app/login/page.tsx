import { Suspense } from "react";
import { AuthPage } from "@/components/auth/AuthPage";
import { Header } from "@/components/layout/Header";

export default function Login() {
  return (
    <main>
      <Header />
      <Suspense>
        <AuthPage mode="login" />
      </Suspense>
    </main>
  );
}
