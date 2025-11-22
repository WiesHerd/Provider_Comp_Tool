import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/layout/header";
import { MainTabs } from "@/components/navigation/main-tabs";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Mobile Provider Compensation Companion",
  description: "wRVU modeling, FMV checks, and call-pay scenarios on your phone",
  manifest: "/manifest.json",
  themeColor: "#00C805",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Provider Comp",
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
        <link rel="icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', () => {
                  navigator.serviceWorker.register('/sw.js')
                    .then((reg) => console.log('SW registered', reg))
                    .catch((err) => console.log('SW registration failed', err));
                });
              }
            `,
          }}
        />
      </head>
      <body className={inter.className}>
        <Header />
        <MainTabs>
          {children}
        </MainTabs>
      </body>
    </html>
  );
}

