import { redirect } from "next/navigation";
import { ADMIN_LOGIN_URL } from "@/lib/admin";

// Редиректит продавца из клиентского приложения в отдельный seller/admin login.
export default function SellerLoginRedirect() {
  redirect(ADMIN_LOGIN_URL);
}
