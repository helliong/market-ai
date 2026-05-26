import type { Order, Product, ProductForm, User } from "./types";

export const initialProducts: Product[] = [
  {
    id: 1,
    name: "iPhone 15 Pro",
    category: "Смартфоны",
    price: 129990,
    stock: 12,
    status: "active",
  },
  {
    id: 2,
    name: "MacBook Air M2",
    category: "Ноутбуки",
    price: 109990,
    stock: 7,
    status: "active",
  },
  {
    id: 3,
    name: "AirPods Pro",
    category: "Аксессуары",
    price: 24990,
    stock: 21,
    status: "draft",
  },
];

export const initialOrders: Order[] = [
  {
    id: "#1001",
    customer: "Иван Петров",
    total: 129990,
    status: "new",
  },
  {
    id: "#1002",
    customer: "Анна Смирнова",
    total: 24990,
    status: "processing",
  },
  {
    id: "#1003",
    customer: "Максим Орлов",
    total: 109990,
    status: "completed",
  },
];

export const initialUsers: User[] = [
  {
    id: 1,
    name: "Администратор",
    email: "admin@marketai.ru",
    role: "admin",
    status: "active",
  },
  {
    id: 2,
    name: "Продавец",
    email: "seller@marketai.ru",
    role: "seller",
    status: "active",
  },
  {
    id: 3,
    name: "Покупатель",
    email: "user@marketai.ru",
    role: "user",
    status: "blocked",
  },
];

export const emptyProductForm: ProductForm = {
  name: "",
  category: "",
  price: "",
  stock: "",
  status: "active",
};
