import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "OpenBible - Free Bible Study App",
  description: "A free, open-source Bible study app with note-taking and classic Christian literature.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.className}>
      <body className="bg-background text-foreground antialiased">
        <main className="min-h-screen">
          {children}
        </main>
      </body>
    </html>
  );
}
