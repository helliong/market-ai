import { configureStore } from "@reduxjs/toolkit";
import cartReducer from "./cartSlice";
import favoritesReducer from "./favoritesSlice";
import compareReducer from "./compareSlice";

export const store = configureStore({
  reducer: {
    cart: cartReducer,
    favorites: favoritesReducer,
    compare: compareReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;