import { createSlice, PayloadAction } from "@reduxjs/toolkit";

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
    toggleCompare: (state, action: PayloadAction<number>) => {
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

export const { toggleCompare } = compareSlice.actions;
export default compareSlice.reducer;
