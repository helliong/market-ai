import { createSlice, PayloadAction } from "@reduxjs/toolkit";

type AuthUser = {
  name: string;
  email: string;
};

type AuthState = {
  user: AuthUser | null;
};

const initialState: AuthState = {
  user: null,
};

export const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    login: (state, action: PayloadAction<AuthUser>) => {
      state.user = action.payload;
    },
    register: (state, action: PayloadAction<AuthUser>) => {
      state.user = action.payload;
    },
    logout: (state) => {
      state.user = null;
    },
  },
});

export const { login, logout, register } = authSlice.actions;
export default authSlice.reducer;
