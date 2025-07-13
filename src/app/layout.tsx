import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/ThemeProvider";
import { UserPreferencesProvider } from "@/components/UserPreferencesProvider";
import { BibleVersionProvider } from "@/components/BibleVersionProvider";
import { AnimationProvider } from "@/components/AnimationProvider";
import { AuthProvider } from "@/components/AuthProvider";
import EnhancedNavigation from "@/components/EnhancedNavigation";
import MobileBottomNav from "@/components/MobileBottomNav";

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
          <AuthProvider>
            <UserPreferencesProvider>
              <BibleVersionProvider>
                <AnimationProvider>
                  <div className="min-h-screen bg-background">
                    <EnhancedNavigation />
                    <div className="pt-16 pb-20 md:pb-0 transition-all duration-300">
                      <main className="min-h-screen">
                        {children}
                      </main>
                    </div>
                    <MobileBottomNav />
                  </div>
                </AnimationProvider>
              </BibleVersionProvider>
            </UserPreferencesProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
