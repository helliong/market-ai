import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import type { AppDispatch, RootState } from "./store";

export type ClientOrderStatus =
  | "processing"
  | "shipping"
  | "ready"
  | "received"
  | "cancelled";

export type ClientOrder = {
  id: string;
  date: string;
  title: string;
  itemsCount: number;
  total: string;
  status: ClientOrderStatus;
  statusLabel: string;
  details: string;
};

type OrdersState = {
  active: ClientOrder[];
  completed: ClientOrder[];
};

const ORDERS_STORAGE_PREFIX = "marketai-client-orders";

const initialState: OrdersState = {
  active: [],
  completed: [],
};

export const ordersSlice = createSlice({
  name: "orders",
  initialState,
  reducers: {
    hydrateOrders: (state, action: PayloadAction<OrdersState>) => {
      state.active = action.payload.active;
      state.completed = action.payload.completed;
    },

    addActiveOrderLocal: (state, action: PayloadAction<ClientOrder>) => {
      const existingIndex = state.active.findIndex(
        (order) => order.id === action.payload.id,
      );

      if (existingIndex >= 0) {
        state.active[existingIndex] = action.payload;
      } else {
        state.active.unshift(action.payload);
      }
    },

    clearOrdersLocal: (state) => {
      state.active = [];
      state.completed = [];
    },
  },
});

export const { hydrateOrders, addActiveOrderLocal, clearOrdersLocal } =
  ordersSlice.actions;

export function hydrateClientOrders() {
  return (dispatch: AppDispatch, getState: () => RootState) => {
    dispatch(hydrateOrders(readStoredOrders(getCurrentUserKey(getState()))));
  };
}

export function addActiveOrder(order: ClientOrder) {
  return (dispatch: AppDispatch, getState: () => RootState) => {
    dispatch(addActiveOrderLocal(order));
    const state = getState();
    writeStoredOrders(getCurrentUserKey(state), state.orders);
  };
}

export function clearOrders() {
  return (dispatch: AppDispatch) => {
    dispatch(clearOrdersLocal());
  };
}

function readStoredOrders(userKey: string): OrdersState {
  if (typeof window === "undefined") {
    return initialState;
  }

  try {
    const storedValue = window.localStorage.getItem(getStorageKey(userKey));

    if (!storedValue) {
      return initialState;
    }

    const parsed = JSON.parse(storedValue) as Partial<OrdersState>;

    return {
      active: Array.isArray(parsed.active) ? parsed.active : [],
      completed: Array.isArray(parsed.completed) ? parsed.completed : [],
    };
  } catch {
    return initialState;
  }
}

function writeStoredOrders(userKey: string, orders: OrdersState) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(getStorageKey(userKey), JSON.stringify(orders));
}

function getCurrentUserKey(state: RootState) {
  return state.auth.user?.id ?? state.auth.user?.email ?? "guest";
}

function getStorageKey(userKey: string) {
  return `${ORDERS_STORAGE_PREFIX}:${userKey}`;
}

export default ordersSlice.reducer;
