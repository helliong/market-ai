import type { ProductForm } from "./types";
import { defaultProductCategory } from "./product-categories";

export const emptyProductForm: ProductForm = {
  sku: "",
  name: "",
  description: "",
  category: defaultProductCategory,
  color: "",
  size: "",
  memory: "",
  material: "",
  brand: "",
  country: "",
  barcode: "",
  gender: "",
  season: "",
  diagonal: "",
  processor: "",
  warranty: "",
  volume: "",
  bundle: "",
  price: "",
  oldPrice: "",
  stock: "",
  status: "active",
  images: [],
};
