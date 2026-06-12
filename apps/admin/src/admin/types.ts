export type ProductStatus = "active" | "draft" | "archived";

export type ProductImage = {
  id: string;
  url: string;
  isMain: boolean;
  sortOrder: number;
  productId?: number;
};

export type ProductImageInput = {
  url: string;
  isMain: boolean;
  sortOrder: number;
};

export type Product = {
  id: number;
  sku: string;
  name: string;
  description: string;
  attributes?: Record<string, string>;
  category: string;
  price: number;
  oldPrice?: number;
  stock: number;
  status: ProductStatus;
  images: ProductImage[];
};

export type OrderStatus = "processing" | "completed" | "cancelled";

export type OrderItem = {
  id: string;
  sku: string;
  productName: string;
  quantity: number;
  price: number;
  imageUrl?: string;
};

export type Order = {
  id: string;
  publicId: string;
  sku: string;
  productName: string;
  customer: string;
  customerPhone?: string | null;
  customerEmail?: string | null;
  deliveryMethod?: string | null;
  deliveryCity?: string | null;
  deliveryStreet?: string | null;
  deliveryHouse?: string | null;
  deliveryFlat?: string | null;
  deliveryComment?: string | null;
  total: number;
  status: OrderStatus;
  items?: OrderItem[];
  cancellationReason?: string;
  cancelledAt?: string | null;
  completedAt?: string | null;
  updatedAt?: string;
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
  color: string;
  size: string;
  memory: string;
  material: string;
  brand: string;
  country: string;
  barcode: string;
  gender: string;
  season: string;
  diagonal: string;
  processor: string;
  warranty: string;
  volume: string;
  bundle: string;
  price: string;
  oldPrice: string;
  stock: string;
  status: ProductStatus;
  images: ProductImageInput[];
};
