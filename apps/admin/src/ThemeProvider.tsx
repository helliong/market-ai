import { useEffect } from "react";
import type { ReactNode } from "react";
import { ensureDefaultTheme, useTheme } from "./settings-store";

export function ThemeProvider({ children }: { children: ReactNode }) {
  const theme = useTheme();

  useEffect(() => {
    ensureDefaultTheme();
  }, []);

  return (
    <div className={`admin-theme-root ${theme === "dark" ? "dark" : ""}`}>
      {children}
    </div>
  );
}
