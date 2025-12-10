import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";

export const metadata: Metadata = {
  title: {
    default: "OnlyCats - 猫との素敵な出会いを",
    template: "%s | OnlyCats",
  },
  description: "里親募集中の猫たちと出会えるマッチングサービス。保護猫、ブリーダーから猫を探して、新しい家族を見つけましょう。",
  keywords: ["猫", "里親", "保護猫", "猫 譲渡", "猫 引き取り", "ペット マッチング", "OnlyCats"],
  authors: [{ name: "OnlyCats" }],
  creator: "OnlyCats",
  publisher: "OnlyCats",
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"),
  openGraph: {
    type: "website",
    locale: "ja_JP",
    siteName: "OnlyCats",
    title: "OnlyCats - 猫との素敵な出会いを",
    description: "里親募集中の猫たちと出会えるマッチングサービス",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "OnlyCats - 猫との素敵な出会いを",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "OnlyCats - 猫との素敵な出会いを",
    description: "里親募集中の猫たちと出会えるマッチングサービス",
    images: ["/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  alternates: {
    canonical: "/",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <meta name="theme-color" content="#FF8C00" />
      </head>
      <body className="antialiased">
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
