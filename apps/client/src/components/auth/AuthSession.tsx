"use client";

import { useEffect } from "react";
import { getCurrentUser } from "@/lib/auth-api";
import { setUser } from "@/store/authSlice";
import { useAppDispatch } from "@/store/hooks";

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
      } catch {
        if (isMounted) {
          dispatch(setUser(null));
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
