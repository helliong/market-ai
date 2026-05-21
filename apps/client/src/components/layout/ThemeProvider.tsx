"use client";

import { useEffect, useState } from "react";

const themeEvent = "marketai-settings";

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<"light" | "dark">("light");

  useEffect(() => {
    function syncTheme() {
      setTheme(localStorage.getItem("marketai-theme") === "dark" ? "dark" : "light");
    }

    syncTheme();
    window.addEventListener("storage", syncTheme);
    window.addEventListener(themeEvent, syncTheme);

    return () => {
      window.removeEventListener("storage", syncTheme);
      window.removeEventListener(themeEvent, syncTheme);
    };
  }, []);

  return (
    <div
      className={`${theme === "dark" ? "dark" : ""} min-h-screen bg-[var(--bg-main)] text-[var(--text-main)] transition-colors`}
    >
      {children}
    </div>
  );
}
