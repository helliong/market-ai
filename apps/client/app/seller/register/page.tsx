import { redirect } from "next/navigation";
import { ADMIN_REGISTER_URL } from "@/lib/admin";

export default function SellerRegisterRedirect() {
  redirect(ADMIN_REGISTER_URL);
}
