import type { Metadata } from "next";
import "./globals.css";
import { Footer } from "@/components/layout/Footer";
import { ThemeProvider } from "@/components/layout/ThemeProvider";
import { StoreProvider } from "@/store/provider";
import { AIWidget } from "@/components/home/AIWidget";
import { CookieBanner } from "@/components/layout/CookieBanner";
import { SITE_URL } from "@/lib/site-url";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "MarketAI",
    template: "%s | MarketAI",
  },
  description:
    "Маркетплейс с ИИ-помощником для поиска товаров, сравнения цен и покупок у проверенных продавцов.",
  openGraph: {
    title: "MarketAI",
    description:
      "Маркетплейс с ИИ-помощником для поиска товаров, сравнения цен и покупок у проверенных продавцов.",
    siteName: "MarketAI",
    locale: "ru_RU",
    type: "website",
  },
};

// Корневой layout задает HTML-обертку, метаданные и общие провайдеры для всего клиентского приложения.
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru" className="h-full antialiased">
      <body className="min-h-screen">
        <StoreProvider>
          <ThemeProvider>
            <div className="flex min-h-screen flex-col">
              <div className="mobile-safe-content flex-1">{children}</div>
              <Footer />
              <AIWidget />
              <CookieBanner />
            </div>
          </ThemeProvider>
        </StoreProvider>
      </body>
    </html>
  );
}
