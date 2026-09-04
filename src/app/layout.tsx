import type { Metadata, Viewport } from "next";
import { Manrope } from "next/font/google";
import AuthStateSync from "@/components/auth/AuthStateSync";
import "./globals.css";

const manrope = Manrope({ subsets: ["latin", "cyrillic"] });

export const metadata: Metadata = {
  title: "Korshi — Сообщество вашего ЖК",
  description: "Единая цифровая среда жилого комплекса",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Korshi",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#166534",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ru" data-scroll-behavior="smooth">
      <body className={manrope.className}>
        <AuthStateSync />
        <div className="min-h-screen bg-[#f8f7f2]">{children}</div>
      </body>
    </html>
  );
}
