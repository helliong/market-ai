"use client";

import { useEffect } from "react";
import { getCurrentUser } from "@/lib/auth-api";
import { setUser } from "@/store/authSlice";
import { hydrateCart } from "@/store/cartSlice";
import { hydrateCompare } from "@/store/compareSlice";
import { hydrateFavorites } from "@/store/favoritesSlice";
import { useAppDispatch } from "@/store/hooks";
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
            isEmailVerified: user.isEmailVerified,
          }),
        );

        await hydrateShoppingState(dispatch).catch(() => undefined);
      } catch {
        if (isMounted) {
          dispatch(setUser(null));
          dispatch(hydrateCart([]));
          dispatch(hydrateFavorites([]));
          dispatch(hydrateCompare([]));
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
