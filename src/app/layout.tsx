import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import AuthStateSync from "@/components/auth/AuthStateSync";
import OneSignalProvider from "@/components/notifications/OneSignalProvider";
import "./globals.css";

const inter = Inter({ subsets: ["latin", "cyrillic"] });

export const metadata: Metadata = {
  title: "HouseSM — Сообщество вашего ЖК",
  description: "Единая цифровая среда жилого комплекса",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "HouseSM",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#16a34a",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ru">
      <body className={inter.className}>
        <AuthStateSync />
        <OneSignalProvider />
        <div className="min-h-screen bg-gray-50">{children}</div>
      </body>
    </html>
  );
}
