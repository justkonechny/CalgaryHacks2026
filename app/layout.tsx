import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Calgary Hacks",
  description: "A Next.js web app starter for Calgary Hacks",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
