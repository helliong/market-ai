import type { OrderStatus, ProductStatus, UserRole, UserStatus } from "./types";

export function formatCurrency(value: number) {
  return `₽ ${new Intl.NumberFormat("ru-RU", {
    maximumFractionDigits: 0,
  }).format(value)}`;
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
    processing: "В обработке",
    completed: "Завершен",
    cancelled: "Отменен",
  };

  return labels[status];
}

export function userRoleLabel(role: UserRole) {
  const labels: Record<UserRole, string> = {
    admin: "Администратор",
    seller: "Продавец",
    user: "Покупатель",
  };

  return labels[role];
}

export function userStatusLabel(status: UserStatus) {
  const labels: Record<UserStatus, string> = {
    active: "Активен",
    blocked: "Заблокирован",
  };

  return labels[status];
}
