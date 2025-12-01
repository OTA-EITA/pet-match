import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "OnlyCats - 猫との素敵な出会いを",
  description: "里親募集中の猫たちと出会えるマッチングサービス",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
