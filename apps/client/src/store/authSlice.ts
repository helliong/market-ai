import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export type AuthUser = {
  id?: string;
  name: string;
  email: string;
  phone?: string | null;
  isEmailVerified?: boolean;
  birthDate?: string | null;
  gender?: string | null;
  displayName?: string | null;
};

type AuthState = {
  user: AuthUser | null;
  isSessionRestored: boolean;
};

const initialState: AuthState = {
  user: null,
  isSessionRestored: false,
};

export const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setUser: (state, action: PayloadAction<AuthUser | null>) => {
      state.user = action.payload;
    },
    login: (state, action: PayloadAction<AuthUser>) => {
      state.user = action.payload;
      state.isSessionRestored = true;
    },
    register: (state, action: PayloadAction<AuthUser>) => {
      state.user = action.payload;
      state.isSessionRestored = true;
    },
    logout: (state) => {
      state.user = null;
      state.isSessionRestored = true;
    },
    markSessionRestored: (state) => {
      state.isSessionRestored = true;
    },
  },
});

export const { login, logout, register, setUser, markSessionRestored } =
  authSlice.actions;
export default authSlice.reducer;
