import type { Metadata } from "next";
import "./globals.css";
import { Footer } from "@/components/layout/Footer";
import { ThemeProvider } from "@/components/layout/ThemeProvider";
import { StoreProvider } from "@/store/provider";

export const metadata: Metadata = {
  title: "Market AI",
  description:
    "Маркетплейс с ИИ-помощником для поиска лучших товаров по лучшим ценам",
};

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
            </div>
          </ThemeProvider>
        </StoreProvider>
      </body>
    </html>
  );
}
