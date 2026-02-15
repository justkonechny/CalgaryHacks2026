import "./globals.css";

export const metadata = {
  title: "Sora",
  description: "TikTok-style feed + Sora generation via Kie API"
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
