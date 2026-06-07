"use client";

import { useEffect } from "react";
import { getCurrentUser } from "@/lib/auth-api";
import { markSessionRestored, setUser } from "@/store/authSlice";
import { hydrateCart } from "@/store/cartSlice";
import { hydrateCompare } from "@/store/compareSlice";
import { hydrateFavorites } from "@/store/favoritesSlice";
import { useAppDispatch } from "@/store/hooks";
import { clearOrders, hydrateClientOrders } from "@/store/ordersSlice";
import { hydrateShoppingState } from "@/store/shoppingHydration";

// Восстанавливает пользователя из backend-сессии и кладет его в Redux при загрузке приложения.
export function AuthSession() {
  const dispatch = useAppDispatch();

  useEffect(() => {
    let isMounted = true;

    async function restoreSession() {
      try {
        const user = await getCurrentUser();

        if (!isMounted) {
          return;
        }

        dispatch(
          setUser({
            id: user.id,
            name: user.name ?? user.displayName ?? "",
            email: user.email,
            phone: user.phone,
            isEmailVerified: user.isEmailVerified,
            avatar: user.avatar,
          }),
        );

        await hydrateShoppingState(dispatch).catch(() => undefined);

        if (!isMounted) {
          return;
        }

        dispatch(hydrateClientOrders());
        dispatch(markSessionRestored());
      } catch {
        if (isMounted) {
          dispatch(setUser(null));
          dispatch(hydrateCart([]));
          dispatch(hydrateFavorites([]));
          dispatch(hydrateCompare([]));
          dispatch(clearOrders());
          dispatch(markSessionRestored());
        }
      }
    }

    void restoreSession();

    return () => {
      isMounted = false;
    };
  }, [dispatch]);

  return null;
}
