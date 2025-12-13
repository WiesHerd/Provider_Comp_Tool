import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import dynamicImport from "next/dynamic";

// Allow static export for Firebase Hosting
// Use 'auto' to allow static export (default for static builds)
export const dynamic = 'auto';

const StoreInitializer = dynamicImport(
  () => import("@/components/store-initializer").then((mod) => ({ default: mod.StoreInitializer })),
  { ssr: false }
);

const WelcomeWalkthrough = dynamicImport(
  () => import("@/components/layout/welcome-walkthrough").then((mod) => ({ default: mod.WelcomeWalkthrough })),
  { ssr: false }
);

const AuthProvider = dynamicImport(
  () => import("@/components/auth/auth-provider").then((mod) => ({ default: mod.AuthProvider })),
  { ssr: false }
);

const RouteGuard = dynamicImport(
  () => import("@/components/auth/route-guard").then((mod) => ({ default: mod.RouteGuard })),
  { ssr: false }
);

const Header = dynamicImport(
  () => import("@/components/layout/header").then((mod) => ({ default: mod.Header })),
  { ssr: false }
);

const EmailVerificationBanner = dynamicImport(
  () => import("@/components/auth/email-verification-banner").then((mod) => ({ default: mod.EmailVerificationBanner })),
  { ssr: false }
);

const MainTabs = dynamicImport(
  () => import("@/components/navigation/main-tabs").then((mod) => ({ default: mod.MainTabs })),
  { ssr: false }
);

const ScreenGuideProvider = dynamicImport(
  () => import("@/components/ui/screen-guide-provider").then((mod) => ({ default: mod.ScreenGuideProvider })),
  { ssr: false }
);

const ErrorBoundary = dynamicImport(
  () => import("@/components/error-boundary").then((mod) => ({ default: mod.ErrorBoundary })),
  { ssr: false }
);

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "CompLens™ | Provider Compensation Intelligence",
  description: "wRVU modeling, FMV analysis, and call-pay scenarios",
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: "/favicon.png", type: "image/png" },
      { url: "/favicon.ico", type: "image/x-icon" },
    ],
    apple: [
      { url: "/icons/icon-180x180.png", sizes: "180x180", type: "image/png" },
      { url: "/icons/icon-167x167.png", sizes: "167x167", type: "image/png" },
      { url: "/icons/icon-152x152.png", sizes: "152x152", type: "image/png" },
      { url: "/icons/icon-192x192.png", sizes: "192x192", type: "image/png" },
    ],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "CompLens",
  },
  other: {
    "mobile-web-app-capable": "yes",
    "apple-mobile-web-app-capable": "yes",
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: "#000000",
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
          <AuthProvider>
            <StoreInitializer />
            <RouteGuard>
              <ScreenGuideProvider>
                <Header />
                <EmailVerificationBanner />
                <MainTabs>
                  {children}
                </MainTabs>
                <WelcomeWalkthrough />
              </ScreenGuideProvider>
            </RouteGuard>
          </AuthProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}

