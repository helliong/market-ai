import { redirect } from "next/navigation";
import { ADMIN_REGISTER_URL } from "@/lib/admin";

// Редиректит продавца из клиентского приложения в отдельную seller/admin регистрацию.
export default function SellerRegisterRedirect() {
  redirect(ADMIN_REGISTER_URL);
}
