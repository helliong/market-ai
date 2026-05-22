import { AuthPage } from "@/components/auth/AuthPage";
import { Header } from "@/components/layout/Header";

export default function SellerLogin() {
  return (
    <main>
      <Header />
      <AuthPage mode="login" audience="seller" />
    </main>
  );
}
