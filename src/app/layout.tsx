import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/ThemeProvider";
import { UserPreferencesProvider } from "@/components/UserPreferencesProvider";
import { BibleVersionProvider } from "@/components/BibleVersionProvider";
import { AnimationProvider } from "@/components/AnimationProvider";
import EnhancedNavigation from "@/components/EnhancedNavigation";

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
        <ThemeProvider
          defaultTheme="system"
        >
          <UserPreferencesProvider>
            <BibleVersionProvider>
              <AnimationProvider>
                <div className="min-h-screen bg-background">
                  <EnhancedNavigation />
                  <div className="pt-16 transition-all duration-300">
                    <main className="min-h-screen">
                      {children}
                    </main>
                  </div>
                </div>
              </AnimationProvider>
            </BibleVersionProvider>
          </UserPreferencesProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
