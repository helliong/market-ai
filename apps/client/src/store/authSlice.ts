import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export type AuthUser = {
  id?: string;
  name: string;
  email: string;
  isEmailVerified?: boolean;
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
    setUser: (state, action: PayloadAction<AuthUser | null>) => {
      state.user = action.payload;
    },
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

export const { login, logout, register, setUser } = authSlice.actions;
export default authSlice.reducer;
