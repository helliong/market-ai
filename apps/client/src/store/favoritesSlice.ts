import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import {
  addServerFavorite,
  removeServerFavorite,
} from "@/lib/shopping-api";
import type { AppDispatch, RootState } from "./store";

type FavoritesState = {
  ids: number[];
};

const initialState: FavoritesState = {
  ids: [],
};

export const favoritesSlice = createSlice({
  name: "favorites",
  initialState,
  reducers: {
    hydrateFavorites: (state, action: PayloadAction<number[]>) => {
      state.ids = action.payload;
    },

    toggleFavoriteLocal: (state, action: PayloadAction<number>) => {
      if (state.ids.includes(action.payload)) {
        state.ids = state.ids.filter((id) => id !== action.payload);
      } else {
        state.ids.unshift(action.payload);
      }
    },
  },
});

export const { hydrateFavorites, toggleFavoriteLocal } = favoritesSlice.actions;

// Переключает товар в избранном и синхронизирует действие с сервером при авторизации.
export function toggleFavorite(productId: number) {
  return async (dispatch: AppDispatch, getState: () => RootState) => {
    const wasFavorite = getState().favorites.ids.includes(productId);

    dispatch(toggleFavoriteLocal(productId));

    if (!getState().auth.user) {
      return;
    }

    if (wasFavorite) {
      await removeServerFavorite(productId).catch(() => undefined);
    } else {
      await addServerFavorite(productId).catch(() => undefined);
    }
  };
}

export default favoritesSlice.reducer;
