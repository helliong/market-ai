import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

// Склеивает CSS-классы и корректно разрешает конфликты Tailwind-утилит.
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
