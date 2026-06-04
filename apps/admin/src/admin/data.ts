import type { ProductForm } from "./types";
import { defaultProductCategory } from "./product-categories";

export const emptyProductForm: ProductForm = {
  sku: "",
  name: "",
  description: "",
  category: defaultProductCategory,
  price: "",
  stock: "",
  status: "active",
};
