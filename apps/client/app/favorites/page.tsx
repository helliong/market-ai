import { Header } from "@/components/layout/Header";
import { FavoritesPage } from "@/components/favorites/FavoritesPage";

// Страница избранного показывает сохраненные пользователем товары.
export default function Favorites() {
  return (
    <main>
      <Header />
      <FavoritesPage />
    </main>
  );
}
