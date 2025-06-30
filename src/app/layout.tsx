import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { Toaster } from "react-hot-toast";
import { AnimationProvider } from "@/components/AnimationProvider";
import { BibleVersionProvider } from "@/components/BibleVersionProvider";
import { AuthProvider } from "@/components/AuthProvider";
import { ThemeProvider } from "@/components/ThemeProvider";
import { UserPreferencesProvider } from "@/components/UserPreferencesProvider";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "OpenBible - Free Bible Study App",
    template: "%s | OpenBible"
  },
  description: "A free, open-source Bible study app with note-taking, bookmarks, and classic Christian literature. Read, study, and grow in your faith.",
  keywords: ["Bible", "study", "notes", "devotions", "Christian", "faith", "scripture", "KJV", "free"],
  authors: [{ name: "OpenBible Team" }],
  creator: "OpenBible",
  publisher: "OpenBible",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "OpenBible",
  },
  openGraph: {
    type: "website",
    siteName: "OpenBible",
    title: "OpenBible - Free Bible Study App",
    description: "A free, open-source Bible study app with note-taking and classic Christian literature",
  },
  twitter: {
    card: "summary_large_image",
    title: "OpenBible - Free Bible Study App",
    description: "A free, open-source Bible study app with note-taking and classic Christian literature",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#1f2937" },
  ],
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={inter.className}>
      <body className="bg-background text-foreground antialiased">
        <ThemeProvider>
          <AuthProvider>
            <UserPreferencesProvider>
              <BibleVersionProvider>
                <AnimationProvider>
                  <main className="min-h-screen">
        {children}
                  </main>
                  <Toaster 
                    position="bottom-center"
                    toastOptions={{
                      duration: 3000,
                      style: {
                        background: '#1f2937',
                        color: '#f9fafb',
                      },
                    }}
                  />
                </AnimationProvider>
              </BibleVersionProvider>
            </UserPreferencesProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
