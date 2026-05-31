import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import {
  addServerCartItem,
  clearServerCart,
  removeServerCartItem,
  updateServerCartItem,
} from "@/lib/shopping-api";
import type { AppDispatch, RootState } from "./store";

export type CartItem = {
  id: number;
  title: string;
  price: string;
  quantity: number;
};

type CartState = {
  items: CartItem[];
};

const initialState: CartState = {
  items: [],
};

export const cartSlice = createSlice({
  name: "cart",
  initialState,
  reducers: {
    hydrateCart: (state, action: PayloadAction<CartItem[]>) => {
      state.items = action.payload;
    },

    addToCartLocal: (
      state,
      action: PayloadAction<Omit<CartItem, "quantity">>,
    ) => {
      const existingItem = state.items.find(
        (item) => item.id === action.payload.id
      );

      if (existingItem) {
        existingItem.quantity += 1;
      } else {
        state.items.push({
          ...action.payload,
          quantity: 1,
        });
      }
    },

    increaseQuantityLocal: (state, action: PayloadAction<number>) => {
      const item = state.items.find((item) => item.id === action.payload);

      if (item) {
        item.quantity += 1;
      }
    },

    decreaseQuantityLocal: (state, action: PayloadAction<number>) => {
      const item = state.items.find((item) => item.id === action.payload);

      if (item && item.quantity > 1) {
        item.quantity -= 1;
      } else {
        state.items = state.items.filter((item) => item.id !== action.payload);
      }
    },

    removeFromCartLocal: (state, action: PayloadAction<number>) => {
      state.items = state.items.filter((item) => item.id !== action.payload);
    },

    clearCartLocal: (state) => {
      state.items = [];
    },
  },
});

export const {
  hydrateCart,
  addToCartLocal,
  increaseQuantityLocal,
  decreaseQuantityLocal,
  removeFromCartLocal,
  clearCartLocal,
} = cartSlice.actions;

function hasUser(state: RootState) {
  return Boolean(state.auth.user);
}

export function addToCart(item: Omit<CartItem, "quantity">) {
  return async (dispatch: AppDispatch, getState: () => RootState) => {
    dispatch(addToCartLocal(item));

    if (!hasUser(getState())) {
      return;
    }

    await addServerCartItem(item.id).catch(() => undefined);
  };
}

export function increaseQuantity(productId: number) {
  return async (dispatch: AppDispatch, getState: () => RootState) => {
    dispatch(increaseQuantityLocal(productId));

    const state = getState();
    const item = state.cart.items.find((cartItem) => cartItem.id === productId);

    if (!hasUser(state) || !item) {
      return;
    }

    await updateServerCartItem(productId, item.quantity).catch(() => undefined);
  };
}

export function decreaseQuantity(productId: number) {
  return async (dispatch: AppDispatch, getState: () => RootState) => {
    dispatch(decreaseQuantityLocal(productId));

    const state = getState();
    const item = state.cart.items.find((cartItem) => cartItem.id === productId);

    if (!hasUser(state)) {
      return;
    }

    if (item) {
      await updateServerCartItem(productId, item.quantity).catch(
        () => undefined,
      );
    } else {
      await removeServerCartItem(productId).catch(() => undefined);
    }
  };
}

export function removeFromCart(productId: number) {
  return async (dispatch: AppDispatch, getState: () => RootState) => {
    dispatch(removeFromCartLocal(productId));

    if (!hasUser(getState())) {
      return;
    }

    await removeServerCartItem(productId).catch(() => undefined);
  };
}

export function clearCart() {
  return async (dispatch: AppDispatch, getState: () => RootState) => {
    dispatch(clearCartLocal());

    if (!hasUser(getState())) {
      return;
    }

    await clearServerCart().catch(() => undefined);
  };
}

export default cartSlice.reducer;
