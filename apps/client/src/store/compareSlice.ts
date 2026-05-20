import { createSlice, PayloadAction } from "@reduxjs/toolkit";

type CompareState = {
  ids: number[];
};

const initialState: CompareState = {
  ids: [],
};

export const compareSlice = createSlice({
  name: "compare",
  initialState,
  reducers: {
    toggleCompare: (state, action: PayloadAction<number>) => {
      if (state.ids.includes(action.payload)) {
        state.ids = state.ids.filter((id) => id !== action.payload);
      } else {
        state.ids.push(action.payload);
      }
    },
  },
});

export const { toggleCompare } = compareSlice.actions;
export default compareSlice.reducer;