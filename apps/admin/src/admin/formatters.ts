import type { OrderStatus, ProductStatus, UserRole, UserStatus } from "./types";

// Форматирует число в валюту для таблиц и статистики продавца.
export function formatCurrency(value: number) {
  return `${new Intl.NumberFormat("ru-RU").format(value)} ₽`;
}

// Возвращает человекочитаемую подпись статуса товара.
export function productStatusLabel(status: ProductStatus) {
  const labels: Record<ProductStatus, string> = {
    active: "Активный",
    draft: "Черновик",
    archived: "Архив",
  };

  return labels[status];
}

// Возвращает человекочитаемую подпись статуса заказа.
export function orderStatusLabel(status: OrderStatus) {
  const labels: Record<OrderStatus, string> = {
    new: "Новый",
    processing: "В обработке",
    completed: "Завершен",
    cancelled: "Отменен",
  };

  return labels[status];
}

// Возвращает человекочитаемую подпись роли пользователя.
export function userRoleLabel(role: UserRole) {
  const labels: Record<UserRole, string> = {
    admin: "Администратор",
    seller: "Продавец",
    user: "Покупатель",
  };

  return labels[role];
}

// Возвращает человекочитаемую подпись статуса пользователя.
export function userStatusLabel(status: UserStatus) {
  const labels: Record<UserStatus, string> = {
    active: "Активен",
    blocked: "Заблокирован",
  };

  return labels[status];
}
