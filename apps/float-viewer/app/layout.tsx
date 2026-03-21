import type { Metadata } from "next";

import "./globals.css";

export const metadata: Metadata = {
  title: "Float Viewer",
  description: "犬の抽出画像が背景の上をふわふわ飛び回るアップロードサイト",
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
