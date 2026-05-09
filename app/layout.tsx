import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "FlowWays",
  description: "AI-assisted task memory app"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}



