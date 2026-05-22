import { AuthPage } from "@/components/auth/AuthPage";
import { Header } from "@/components/layout/Header";

export default function SellerRegister() {
  return (
    <main>
      <Header />
      <AuthPage mode="register" audience="seller" />
    </main>
  );
}
