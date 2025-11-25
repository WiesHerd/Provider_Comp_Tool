import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/layout/header";
import { MainTabs } from "@/components/navigation/main-tabs";
import { ScreenGuideProvider } from "@/components/ui/screen-guide-provider";
import { ErrorBoundary } from "@/components/error-boundary";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "CompLens™ | Provider Compensation Intelligence",
  description: "wRVU modeling, FMV analysis, and call-pay scenarios",
  manifest: "/manifest.json",
  themeColor: "#6366f1",
  viewport: {
    width: "device-width",
    initialScale: 1,
    maximumScale: 5,
    userScalable: true,
  },
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
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=5.0, user-scalable=yes" />
      </head>
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
        <ErrorBoundary>
          <ScreenGuideProvider>
            <Header />
            <MainTabs>
              {children}
            </MainTabs>
          </ScreenGuideProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}

