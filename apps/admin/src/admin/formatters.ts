import type { OrderStatus, ProductStatus } from "./types";

export function formatCurrency(value: number) {
  return `${new Intl.NumberFormat("ru-RU").format(value)} ₽`;
}

export function productStatusLabel(status: ProductStatus) {
  const labels: Record<ProductStatus, string> = {
    active: "Активный",
    draft: "Черновик",
    archived: "Архив",
  };

  return labels[status];
}

export function orderStatusLabel(status: OrderStatus) {
  const labels: Record<OrderStatus, string> = {
    new: "Новый",
    processing: "В обработке",
    completed: "Завершен",
    cancelled: "Отменен",
  };

  return labels[status];
}
