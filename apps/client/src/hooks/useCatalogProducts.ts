"use client";

import { useEffect, useState, useCallback } from "react";
import { getCatalogProducts, getCatalogFeed } from "@/lib/catalog-products";
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

export function useCatalogFeed(
  initialProducts: ClientProduct[] = EMPTY_PRODUCTS,
  initialNextCursor: number | null = null,
) {
  const [products, setProducts] = useState<ClientProduct[]>(initialProducts);
  const [nextCursor, setNextCursor] = useState<number | null>(initialNextCursor);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  useEffect(() => {
    if (initialProducts.length > 0) {
      setProducts(initialProducts);
      setNextCursor(initialNextCursor);
      return;
    }

    let isMounted = true;
    async function loadInitial() {
      const feed = await getCatalogFeed();
      if (isMounted) {
        setProducts(feed.items);
        setNextCursor(feed.nextCursor);
      }
    }

    void loadInitial();
    return () => {
      isMounted = false;
    };
  }, [initialProducts, initialNextCursor]);

  const loadMore = useCallback(async () => {
    if (isLoadingMore || !nextCursor) return;

    setIsLoadingMore(true);
    try {
      const feed = await getCatalogFeed(nextCursor);
      
      setProducts((prev) => {
        // Убираем возможные дубликаты
        const existingIds = new Set(prev.map((p) => p.id));
        const newItems = feed.items.filter((p) => !existingIds.has(p.id));
        return [...prev, ...newItems];
      });
      setNextCursor(feed.nextCursor);
    } finally {
      setIsLoadingMore(false);
    }
  }, [nextCursor, isLoadingMore]);

  return {
    products,
    isLoadingMore,
    hasMore: nextCursor !== null,
    loadMore,
  };
}
