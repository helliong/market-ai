import { useSyncExternalStore } from "react";

export const settingsEvent = "marketai-settings";
const themeKey = "marketai-theme";
const languageKey = "marketai-language";

export type Theme = "light" | "dark";

// Подписывает компоненты на изменения темы и языка в localStorage.
export function subscribeToSettings(onChange: () => void) {
  window.addEventListener("storage", onChange);
  window.addEventListener(settingsEvent, onChange);

  return () => {
    window.removeEventListener("storage", onChange);
    window.removeEventListener(settingsEvent, onChange);
  };
}

// Читает текущую тему продавческой админки из localStorage.
export function getThemeSnapshot(): Theme {
  return localStorage.getItem(themeKey) === "light" ? "light" : "dark";
}

// Читает текущий язык продавческой админки из localStorage.
export function getLanguageSnapshot() {
  return localStorage.getItem(languageKey) || "Русский";
}

// Сохраняет выбранную тему и уведомляет интерфейс об изменении.
export function setTheme(nextTheme: Theme) {
  localStorage.setItem(themeKey, nextTheme);
  window.dispatchEvent(new Event(settingsEvent));
}

// Сохраняет выбранный язык и уведомляет интерфейс об изменении.
export function setLanguage(nextLanguage: string) {
  localStorage.setItem(languageKey, nextLanguage);
  window.dispatchEvent(new Event(settingsEvent));
}

// Выставляет светлую тему по умолчанию, если пользователь еще ничего не выбирал.
export function ensureDefaultTheme() {
  if (!localStorage.getItem(themeKey)) {
    setTheme("dark");
  }
}

// React-хук для чтения текущей темы через useSyncExternalStore.
export function useTheme() {
  return useSyncExternalStore(subscribeToSettings, getThemeSnapshot, () => "dark");
}

// React-хук для чтения текущего языка через useSyncExternalStore.
export function useLanguage() {
  return useSyncExternalStore(
    subscribeToSettings,
    getLanguageSnapshot,
    () => "Русский",
  );
}
