import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { addServerCompare, removeServerCompare } from "@/lib/shopping-api";
import type { AppDispatch, RootState } from "./store";

type CompareState = {
  ids: number[];
};

const initialState: CompareState = {
  ids: [],
};

export const COMPARE_LIMIT = 6;

export const compareSlice = createSlice({
  name: "compare",
  initialState,
  reducers: {
    hydrateCompare: (state, action: PayloadAction<number[]>) => {
      state.ids = action.payload.slice(0, COMPARE_LIMIT);
    },

    toggleCompareLocal: (state, action: PayloadAction<number>) => {
      if (state.ids.includes(action.payload)) {
        state.ids = state.ids.filter((id) => id !== action.payload);
      } else if (state.ids.length < COMPARE_LIMIT) {
        state.ids.push(action.payload);
      } else {
        return;
      }
    },
  },
});

export const { hydrateCompare, toggleCompareLocal } = compareSlice.actions;

export function toggleCompare(productId: number) {
  return async (dispatch: AppDispatch, getState: () => RootState) => {
    const stateBefore = getState();
    const wasCompared = stateBefore.compare.ids.includes(productId);
    const canAdd = stateBefore.compare.ids.length < COMPARE_LIMIT;

    dispatch(toggleCompareLocal(productId));

    if (!stateBefore.auth.user || (!wasCompared && !canAdd)) {
      return;
    }

    if (wasCompared) {
      await removeServerCompare(productId).catch(() => undefined);
    } else {
      await addServerCompare(productId).catch(() => undefined);
    }
  };
}

export default compareSlice.reducer;
