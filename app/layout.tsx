import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Developer OS",
  description: "Developer task and notes workspace",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
