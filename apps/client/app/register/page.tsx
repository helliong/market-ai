import { AuthPage } from "@/components/auth/AuthPage";
import { Header } from "@/components/layout/Header";

export default function Register() {
  return (
    <main>
      <Header />
      <AuthPage mode="register" />
    </main>
  );
}
