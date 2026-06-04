import { getCatalogProducts } from "@/lib/catalog-products";
import {
  addServerCartItem,
  addServerCompare,
  addServerFavorite,
  getServerCart,
  getServerCompare,
  getServerFavorites,
} from "@/lib/shopping-api";
import { hydrateCart } from "./cartSlice";
import { hydrateCompare } from "./compareSlice";
import { hydrateFavorites } from "./favoritesSlice";
import type { AppDispatch, RootState } from "./store";

type ShoppingState = Pick<RootState, "cart" | "favorites" | "compare">;

// Переносит локальную корзину, избранное и сравнение на сервер после входа пользователя.
export async function persistLocalShoppingState(state: ShoppingState) {
  await Promise.allSettled([
    ...state.cart.items.map((item) =>
      addServerCartItem(item.id, item.quantity),
    ),
    ...state.favorites.ids.map((productId) => addServerFavorite(productId)),
    ...state.compare.ids.map((productId) => addServerCompare(productId)),
  ]);
}

// Загружает серверные shopping-списки и кладет их в Redux после авторизации.
export async function hydrateShoppingState(dispatch: AppDispatch) {
  const [cart, favorites, compare, products] = await Promise.all([
    getServerCart(),
    getServerFavorites(),
    getServerCompare(),
    getCatalogProducts(),
  ]);

  dispatch(
    hydrateCart(
      cart.items
        .map((item) => {
          const product = products.find(
            (currentProduct) => currentProduct.id === item.productId,
          );

          if (!product) {
            return null;
          }

          return {
            id: product.id,
            title: product.title,
            price: product.price,
            quantity: item.quantity,
          };
        })
        .filter((item) => item !== null),
    ),
  );
  dispatch(hydrateFavorites(favorites.ids));
  dispatch(hydrateCompare(compare.ids));
}
