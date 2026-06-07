"use client";

import { useEffect, useState } from "react";
import { getCatalogProducts } from "@/lib/catalog-products";
import type { ClientProduct } from "@/lib/catalog-products";

const EMPTY_PRODUCTS: ClientProduct[] = [];

export function useCatalogProducts(initialProducts: ClientProduct[] = EMPTY_PRODUCTS) {
  const [products, setProducts] = useState<ClientProduct[]>(initialProducts);

  useEffect(() => {
    if (initialProducts.length > 0) {
      setProducts(initialProducts);
      return;
    }

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
  }, [initialProducts]);

  return products;
}
