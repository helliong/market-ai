import { createSlice, PayloadAction } from "@reduxjs/toolkit";

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
    toggleFavorite: (state, action: PayloadAction<number>) => {
      if (state.ids.includes(action.payload)) {
        state.ids = state.ids.filter((id) => id !== action.payload);
      } else {
        state.ids.push(action.payload);
      }
    },
  },
});

export const { toggleFavorite } = favoritesSlice.actions;
export default favoritesSlice.reducer;