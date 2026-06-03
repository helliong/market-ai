import { Header } from "@/components/layout/Header";
import { ProfilePage } from "@/components/profile/ProfilePage";

// Страница профиля показывает данные аккаунта и быстрые ссылки на личные разделы.
export default function Profile() {
  return (
    <main>
      <Header />
      <ProfilePage />
    </main>
  );
}
