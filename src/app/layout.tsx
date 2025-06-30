import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "OpenBible - Test",
  description: "Testing OpenBible app deployment",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={inter.className}>
      <body className="bg-white text-gray-900 antialiased">
        <main className="min-h-screen">
          {children}
        </main>
      </body>
    </html>
  );
}
