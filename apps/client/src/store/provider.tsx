"use client";

import { Provider } from "react-redux";
import { AuthSession } from "@/components/auth/AuthSession";
import { store } from "./store";

export function StoreProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Provider store={store}>
      <AuthSession />
      {children}
    </Provider>
  );
}