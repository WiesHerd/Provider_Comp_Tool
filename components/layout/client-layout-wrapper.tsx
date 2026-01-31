'use client';

import dynamic from 'next/dynamic';

// All client-side components with ssr: false
const StoreInitializer = dynamic(
  () => import("@/components/store-initializer").then((mod) => ({ default: mod.StoreInitializer })),
  { ssr: false }
);

const WelcomeWalkthrough = dynamic(
  () => import("@/components/layout/welcome-walkthrough").then((mod) => ({ default: mod.WelcomeWalkthrough })),
  { ssr: false }
);

const AuthProvider = dynamic(
  () => import("@/components/auth/auth-provider").then((mod) => ({ default: mod.AuthProvider })),
  { ssr: false }
);

const RouteGuard = dynamic(
  () => import("@/components/auth/route-guard").then((mod) => ({ default: mod.RouteGuard })),
  { ssr: false }
);

const Header = dynamic(
  () => import("@/components/layout/header").then((mod) => ({ default: mod.Header })),
  { ssr: false }
);

const EmailVerificationBanner = dynamic(
  () => import("@/components/auth/email-verification-banner").then((mod) => ({ default: mod.EmailVerificationBanner })),
  { ssr: false }
);

const TrialWelcomeBanner = dynamic(
  () => import("@/components/auth/trial-welcome-banner").then((mod) => ({ default: mod.TrialWelcomeBanner })),
  { ssr: false }
);

const MainTabs = dynamic(
  () => import("@/components/navigation/main-tabs").then((mod) => ({ default: mod.MainTabs })),
  { ssr: false }
);

const ScreenGuideProvider = dynamic(
  () => import("@/components/ui/screen-guide-provider").then((mod) => ({ default: mod.ScreenGuideProvider })),
  { ssr: false }
);

const ErrorBoundary = dynamic(
  () => import("@/components/error-boundary").then((mod) => ({ default: mod.ErrorBoundary })),
  { ssr: false }
);

const Footer = dynamic(
  () => import("@/components/layout/footer").then((mod) => ({ default: mod.Footer })),
  { ssr: false }
);

interface ClientLayoutWrapperProps {
  children: React.ReactNode;
}

export function ClientLayoutWrapper({ children }: ClientLayoutWrapperProps) {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <StoreInitializer />
        <RouteGuard>
          <ScreenGuideProvider>
            <Header />
            <EmailVerificationBanner />
            <TrialWelcomeBanner />
            <MainTabs>
              {children}
            </MainTabs>
            <WelcomeWalkthrough />
            <Footer />
          </ScreenGuideProvider>
        </RouteGuard>
      </AuthProvider>
    </ErrorBoundary>
  );
}

