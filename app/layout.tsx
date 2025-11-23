import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/layout/header";
import { MainTabs } from "@/components/navigation/main-tabs";
// Tour system simplified - using simple modals per screen instead

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "CompLens™ | Provider Compensation Intelligence",
  description: "wRVU modeling, FMV analysis, and call-pay scenarios",
  manifest: "/manifest.json",
  themeColor: "#6366f1",
  icons: {
    icon: [
      { url: "/favicon.png", type: "image/png" },
      { url: "/favicon.ico", type: "image/x-icon" },
    ],
    apple: [
      { url: "/icons/icon-152x152.png", sizes: "152x152", type: "image/png" },
      { url: "/icons/icon-192x192.png", sizes: "192x192", type: "image/png" },
    ],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "CompLens",
  },
  other: {
    "mobile-web-app-capable": "yes",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              // Disable service worker completely in development
              if ('serviceWorker' in navigator) {
                navigator.serviceWorker.getRegistrations().then((registrations) => {
                  registrations.forEach((registration) => {
                    registration.unregister();
                    console.log('Service worker unregistered');
                  });
                });
                // Prevent new registrations in development
                if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
                  navigator.serviceWorker.register = function() {
                    return Promise.reject('Service worker disabled in development');
                  };
                }
              }
            `,
          }}
        />
        <Header />
        <MainTabs>
          {children}
        </MainTabs>
      </body>
    </html>
  );
}

