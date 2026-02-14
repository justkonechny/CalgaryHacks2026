import "./globals.css";

export const metadata = {
  title: "Calgary Hacks",
  description: "A Next.js web app starter for Calgary Hacks",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
