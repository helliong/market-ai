"use client";

import { useEffect, useState } from "react";
import { getCatalogProducts } from "@/lib/catalog-products";
import type { ClientProduct } from "@/lib/catalog-products";

export function useCatalogProducts() {
  const [products, setProducts] = useState<ClientProduct[]>([]);

  useEffect(() => {
    let isMounted = true;

    async function loadProducts() {
      const catalogProducts = await getCatalogProducts();

      if (isMounted) {
        setProducts(catalogProducts);
      }
    }

    void loadProducts();

    return () => {
      isMounted = false;
    };
  }, []);

  return products;
}
