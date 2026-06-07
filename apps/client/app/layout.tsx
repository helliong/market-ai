import type { Metadata } from "next";
import "./globals.css";
import { Footer } from "@/components/layout/Footer";
import { ThemeProvider } from "@/components/layout/ThemeProvider";
import { StoreProvider } from "@/store/provider";
import { AIWidget } from "@/components/home/AIWidget";

export const metadata: Metadata = {
  title: "Market AI",
  description:
    "Маркетплейс с ИИ-помощником для поиска лучших товаров по лучшим ценам",
};

// Корневой layout задает HTML-обертку, метаданные и общие провайдеры для всего клиентского приложения.
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-screen">
        <StoreProvider>
          <ThemeProvider>
            <div className="flex min-h-screen flex-col">
              <div className="mobile-safe-content flex-1">{children}</div>
              <Footer />
              <AIWidget />
            </div>
          </ThemeProvider>
        </StoreProvider>
      </body>
    </html>
  );
}
