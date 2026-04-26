import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "複利シミュレーター v2",
  description: "ライフプラン・複利シミュレーター",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  );
}
