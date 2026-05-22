import { redirect } from "next/navigation";
import { ADMIN_LOGIN_URL } from "@/lib/admin";

export default function SellerLoginRedirect() {
  redirect(ADMIN_LOGIN_URL);
}
