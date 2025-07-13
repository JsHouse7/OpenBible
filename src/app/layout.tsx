import type { Metadata } from "next";
import { Inter, Merriweather, Crimson_Text, Lora, Playfair_Display, Source_Serif_4, EB_Garamond, Libre_Baskerville } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/ThemeProvider";
import { UserPreferencesProvider } from "@/components/UserPreferencesProvider";
import { BibleVersionProvider } from "@/components/BibleVersionProvider";
import { AnimationProvider } from "@/components/AnimationProvider";
import { AuthProvider } from "@/components/AuthProvider";
import EnhancedNavigation from "@/components/EnhancedNavigation";
import MobileBottomNav from "@/components/MobileBottomNav";

// Load multiple fonts for Bible reading
const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

const merriweather = Merriweather({
  subsets: ["latin"],
  weight: ["300", "400", "700"],
  display: "swap",
  variable: "--font-merriweather",
});

const crimsonText = Crimson_Text({
  subsets: ["latin"],
  weight: ["400", "600"],
  display: "swap",
  variable: "--font-crimson",
});

const lora = Lora({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  display: "swap",
  variable: "--font-lora",
});

const playfairDisplay = Playfair_Display({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  display: "swap",
  variable: "--font-playfair",
});

const sourceSerif = Source_Serif_4({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  display: "swap",
  variable: "--font-source-serif",
});

const ebGaramond = EB_Garamond({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  display: "swap",
  variable: "--font-eb-garamond",
});

const libreBaskerville = Libre_Baskerville({
  subsets: ["latin"],
  weight: ["400", "700"],
  display: "swap",
  variable: "--font-libre-baskerville",
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
    <html lang="en" className={`${inter.variable} ${merriweather.variable} ${crimsonText.variable} ${lora.variable} ${playfairDisplay.variable} ${sourceSerif.variable} ${ebGaramond.variable} ${libreBaskerville.variable}`}>
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
