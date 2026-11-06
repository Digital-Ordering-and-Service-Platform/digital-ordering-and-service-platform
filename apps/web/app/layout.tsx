import type { Metadata } from "next";
import "./globals.css";
import "../public/output.css";

export const metadata: Metadata = {
  title: "MenuFlow — Digital Menu & Ordering",
  description: "QR-code digital menu and ordering platform for Ethiopian restaurants and cafes.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="stylesheet" href="/output.css" />
      </head>
      <body className="antialiased bg-[#fff8f5] text-[#1e1b19]">{children}</body>
    </html>
  );
}
