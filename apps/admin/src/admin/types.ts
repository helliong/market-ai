export type ProductStatus = "active" | "draft" | "archived";

export type Product = {
  id: number;
  name: string;
  category: string;
  price: number;
  stock: number;
  status: ProductStatus;
};

export type OrderStatus = "new" | "processing" | "completed" | "cancelled";

export type Order = {
  id: string;
  customer: string;
  total: number;
  status: OrderStatus;
};

export type UserRole = "admin" | "seller" | "user";
export type UserStatus = "active" | "blocked";

export type User = {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  status: UserStatus;
};

export type ProductForm = {
  name: string;
  category: string;
  price: string;
  stock: string;
  status: ProductStatus;
};
