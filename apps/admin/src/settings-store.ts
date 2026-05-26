import { useSyncExternalStore } from "react";

export const settingsEvent = "marketai-settings";
const themeKey = "marketai-theme";
const languageKey = "marketai-language";

export type Theme = "light" | "dark";

export function subscribeToSettings(onChange: () => void) {
  window.addEventListener("storage", onChange);
  window.addEventListener(settingsEvent, onChange);

  return () => {
    window.removeEventListener("storage", onChange);
    window.removeEventListener(settingsEvent, onChange);
  };
}

export function getThemeSnapshot(): Theme {
  return localStorage.getItem(themeKey) === "light" ? "light" : "dark";
}

export function getLanguageSnapshot() {
  return localStorage.getItem(languageKey) || "Русский";
}

export function setTheme(nextTheme: Theme) {
  localStorage.setItem(themeKey, nextTheme);
  window.dispatchEvent(new Event(settingsEvent));
}

export function setLanguage(nextLanguage: string) {
  localStorage.setItem(languageKey, nextLanguage);
  window.dispatchEvent(new Event(settingsEvent));
}

export function ensureDefaultTheme() {
  if (!localStorage.getItem(themeKey)) {
    setTheme("dark");
  }
}

export function useTheme() {
  return useSyncExternalStore(subscribeToSettings, getThemeSnapshot, () => "dark");
}

export function useLanguage() {
  return useSyncExternalStore(
    subscribeToSettings,
    getLanguageSnapshot,
    () => "Русский",
  );
}
