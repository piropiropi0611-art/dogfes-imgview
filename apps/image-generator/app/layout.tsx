import type { Metadata } from "next";

import "./globals.css";

export const metadata: Metadata = {
  title: "Image Generator",
  description: "犬画像をもとに背景付きアニメイラストを生成するアプリ",
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
