export type ProductStatus = "active" | "draft" | "archived";

export type Product = {
  id: number;
  sku: string;
  name: string;
  description: string;
  category: string;
  price: number;
  stock: number;
  status: ProductStatus;
};

export type OrderStatus = "processing" | "completed" | "cancelled";

export type OrderItem = {
  id: string;
  sku: string;
  productName: string;
  quantity: number;
  price: number;
};

export type Order = {
  id: string;
  publicId: string;
  sku: string;
  productName: string;
  customer: string;
  total: number;
  status: OrderStatus;
  items?: OrderItem[];
  cancellationReason?: string;
  createdAt: string;
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
  sku: string;
  name: string;
  description: string;
  category: string;
  price: string;
  stock: string;
  status: ProductStatus;
};
