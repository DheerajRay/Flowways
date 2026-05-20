import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "FlowWays",
  description: "AI-assisted task memory app",
  icons: {
    icon: [
      { url: "/icons/icon-192-v3.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512-v3.png", sizes: "512x512", type: "image/png" }
    ],
    apple: [{ url: "/icons/apple-touch-icon-v3.png", sizes: "180x180", type: "image/png" }],
    shortcut: ["/icons/icon-192-v3.png"]
  }
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
