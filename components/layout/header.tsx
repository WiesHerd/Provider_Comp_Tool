'use client';

import { useState, useEffect } from 'react';
import { Sun, Moon, Info, ChevronLeft, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import * as Dialog from '@radix-ui/react-dialog';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import Image from 'next/image';
import { useTour } from '@/hooks/use-tour';
import { cn } from '@/lib/utils/cn';

// Safe tour hook that doesn't throw if provider isn't available
function useTourSafe() {
  try {
    return useTour();
  } catch {
    return { startTour: () => {} };
  }
}

// Page title mapping for header
const getPageTitle = (pathname: string): string | null => {
  if (pathname === '/') return null;
  if (pathname === '/wrvu-modeler') return 'wRVU & Incentive Modeler';
  if (pathname === '/fmv-calculator') return 'FMV Calculator';
  if (pathname.startsWith('/fmv-calculator/wrvu')) return 'wRVU Calculator';
  if (pathname.startsWith('/fmv-calculator/tcc')) return 'TCC Calculator';
  if (pathname.startsWith('/fmv-calculator/cf')) return 'CF Calculator';
  if (pathname === '/call-pay-modeler') return 'Call Pay Modeler';
  if (pathname === '/scenarios') return 'Scenarios';
  if (pathname.startsWith('/scenarios/')) return 'Edit Scenario';
  return null;
};

export function Header() {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [mounted, setMounted] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { startTour } = useTourSafe();
  const isHome = mounted && pathname === '/';
  const pageTitle = mounted && pathname ? getPageTitle(pathname) : null;

  useEffect(() => {
    setMounted(true);
    const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    const storedTheme = localStorage.getItem('theme') as 'light' | 'dark' | null;
    const initialTheme = storedTheme || systemTheme;
    setTheme(initialTheme);
    document.documentElement.classList.toggle('dark', initialTheme === 'dark');
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    document.documentElement.classList.toggle('dark', newTheme === 'dark');
  };

  const handleLogoClick = (e: React.MouseEvent) => {
    if (!mounted) return;
    if (pathname === '/') {
      // On home page, scroll to top
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      // On other pages, navigate to home
      router.push('/');
    }
  };

  const logoContent = (
    <div className="relative animate-logo-enter">
      <Image
        src="/Logo.png"
        alt="CompLens"
        width={40}
        height={40}
        className="w-10 h-10 sm:w-11 sm:h-11 md:w-12 md:h-12 object-contain rounded-xl transition-all duration-300 relative z-10"
        style={{
          filter: 'drop-shadow(0 2px 8px rgba(0, 0, 0, 0.1)) drop-shadow(0 1px 3px rgba(0, 0, 0, 0.08))',
        }}
        priority
        quality={100}
        unoptimized
      />
      <div 
        className="absolute inset-0 bg-gradient-to-br from-blue-400 via-purple-500 to-green-400 dark:from-blue-500 dark:via-purple-500 dark:to-green-500 rounded-xl opacity-15 dark:opacity-12 blur-sm animate-pulse-slow"
        style={{
          filter: 'blur(8px)',
        }}
      />
      {/* Subtle glow effect */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-transparent to-transparent rounded-xl opacity-0 dark:opacity-0 transition-opacity duration-300" />
    </div>
  );

  return (
    <header 
      className={cn(
        "fixed top-0 left-0 right-0 z-50 safe-area-inset-top",
        "border-b transition-colors duration-500",
        "border-gray-200/60 dark:border-gray-800/60",
        "bg-white/80 dark:bg-gray-900/80",
        "backdrop-blur-2xl backdrop-saturate-150",
        "shadow-[0_1px_0_0_rgba(0,0,0,0.05)] dark:shadow-[0_1px_0_0_rgba(255,255,255,0.05)]",
        "supports-[backdrop-filter]:bg-white/70 supports-[backdrop-filter]:dark:bg-gray-900/70"
      )}
      suppressHydrationWarning
    >
      {/* Subtle gradient overlay for depth */}
      <div className="absolute inset-0 bg-gradient-to-b from-white/50 to-transparent dark:from-gray-900/50 pointer-events-none" />
      
      <div className="relative max-w-7xl mx-auto px-5 sm:px-6 lg:px-8 py-4 md:py-5 z-10">
        <div className="flex items-center justify-between relative z-10">
          <div className="flex items-center gap-4 sm:gap-5">
            {/* Back button - Apple style (only show when not on home) */}
            {mounted && pathname && pathname !== '/' && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.back()}
                className={cn(
                  "min-w-[44px] h-[44px] -ml-2 rounded-full",
                  "hover:bg-gray-100/80 dark:hover:bg-gray-800/80",
                  "transition-all duration-300 ease-out",
                  "active:scale-[0.96]",
                  "hover:shadow-sm",
                  "animate-icon-enter"
                )}
                aria-label="Go back"
              >
                <ChevronLeft className="w-5 h-5 transition-transform duration-300 group-hover:-translate-x-0.5" />
              </Button>
            )}
            
            {/* Logo - clickable to go home (Apple style) */}
            <Link
              href="/"
              className={cn(
                "flex items-center gap-3 sm:gap-4",
                "transition-all duration-300 ease-out",
                "hover:opacity-90 active:opacity-80",
                "active:scale-[0.98]",
                "touch-manipulation cursor-pointer"
              )}
              aria-label="Go to home"
              title="Go to home"
            >
              {logoContent}
            </Link>
            
            {/* Page title - Apple style (subtle, in header) */}
            {pageTitle && (
              <h1 className={cn(
                "text-base sm:text-lg md:text-xl",
                "font-semibold text-gray-900 dark:text-white",
                "ml-1 hidden sm:block",
                "tracking-[-0.01em]",
                "animate-fade-in",
                "transition-opacity duration-300"
              )}>
                {pageTitle}
              </h1>
            )}
          </div>

          <div className="flex items-center gap-2 sm:gap-3 relative z-20">
            <Button 
              type="button"
              variant="ghost" 
              size="sm" 
              className={cn(
                "min-w-[44px] h-[44px] rounded-full",
                "hover:bg-gray-100/80 dark:hover:bg-gray-800/80",
                "transition-all duration-300 ease-out",
                "active:scale-[0.96]",
                "hover:shadow-sm",
                "group",
                "animate-icon-enter",
                "relative z-20"
              )}
              onClick={() => {
                startTour();
              }}
              aria-label="Take tour"
              title="Take tour"
              style={{ animationDelay: '0.1s' }}
            >
              <Sparkles className="w-5 h-5 transition-all duration-300 group-hover:scale-110 group-hover:animate-sparkle-pulse" />
            </Button>
            <Button 
              type="button"
              variant="ghost" 
              size="sm" 
              className={cn(
                "min-w-[44px] h-[44px] rounded-full",
                "hover:bg-gray-100/80 dark:hover:bg-gray-800/80",
                "transition-all duration-300 ease-out",
                "active:scale-[0.96]",
                "hover:shadow-sm",
                "group",
                "animate-icon-enter",
                "relative z-20"
              )}
              onClick={() => {
                setDialogOpen(true);
              }}
              aria-label="Show instructions"
              style={{ animationDelay: '0.15s' }}
            >
              <Info className="w-5 h-5 transition-all duration-300 group-hover:scale-110" />
            </Button>
            <Dialog.Root open={dialogOpen} onOpenChange={setDialogOpen}>
              <Dialog.Portal>
                <Dialog.Overlay 
                  className={cn(
                    "fixed inset-0 z-[100]",
                    "bg-black/40 dark:bg-black/60",
                    "backdrop-blur-sm",
                    "animate-in fade-in duration-300",
                    "transition-opacity"
                  )} 
                />
                <Dialog.Content 
                  className={cn(
                    "fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2",
                    "bg-white/95 dark:bg-gray-900/95",
                    "backdrop-blur-2xl backdrop-saturate-150",
                    "rounded-3xl p-6 sm:p-8",
                    "max-w-lg w-[90vw] max-h-[85vh]",
                    "overflow-y-auto z-[101]",
                    "shadow-2xl",
                    "border border-gray-200/50 dark:border-gray-800/50",
                    "animate-in fade-in zoom-in-95 duration-300",
                    "supports-[backdrop-filter]:bg-white/90 supports-[backdrop-filter]:dark:bg-gray-900/90"
                  )}
                >
                  <Dialog.Title className={cn(
                    "text-2xl sm:text-3xl font-bold mb-6",
                    "text-gray-900 dark:text-white",
                    "tracking-tight"
                  )}>
                    How to Use CompLens™
                  </Dialog.Title>
                  
                  <div className="space-y-5 sm:space-y-6 text-sm sm:text-base text-gray-700 dark:text-gray-300 leading-relaxed">
                    <div>
                      <h4 className={cn(
                        "font-semibold text-gray-900 dark:text-white mb-3",
                        "text-base sm:text-lg"
                      )}>
                        Navigation
                      </h4>
                      <ul className="list-disc list-inside space-y-2 ml-2 text-gray-600 dark:text-gray-400">
                        <li>Click the <strong className="text-gray-900 dark:text-white">logo</strong> (top-left) to return to home</li>
                        <li>Use the <strong className="text-gray-900 dark:text-white">back button</strong> (chevron) to go back in history</li>
                        <li>On mobile, use the <strong className="text-gray-900 dark:text-white">bottom navigation tabs</strong> to navigate between tools</li>
                      </ul>
                    </div>

                    <div>
                      <h4 className={cn(
                        "font-semibold text-gray-900 dark:text-white mb-3",
                        "text-base sm:text-lg"
                      )}>
                        Four Main Tools
                      </h4>
                      <ul className="space-y-3 text-gray-600 dark:text-gray-400">
                        <li>
                          <strong className="text-gray-900 dark:text-white">wRVU & Incentive Modeler:</strong> Estimate work Relative Value Units and calculate productivity incentives based on FTE and conversion factors.
                        </li>
                        <li>
                          <strong className="text-gray-900 dark:text-white">FMV Calculator:</strong> Perform fast FMV reasonableness checks and percentile analysis across TCC, wRVU, and Conversion Factor metrics.
                        </li>
                        <li>
                          <strong className="text-gray-900 dark:text-white">Call Pay Modeler:</strong> Model call-pay structures with per-call, per-shift, or tiered payment methods and see annualized outputs.
                        </li>
                        <li>
                          <strong className="text-gray-900 dark:text-white">Provider Schedule & wRVU Forecaster:</strong> Forecast annual wRVUs and compensation based on your schedule and patient load.
                        </li>
                      </ul>
                    </div>

                    <div>
                      <h4 className={cn(
                        "font-semibold text-gray-900 dark:text-white mb-3",
                        "text-base sm:text-lg"
                      )}>
                        Saving Scenarios
                      </h4>
                      <p className="text-gray-600 dark:text-gray-400">
                        Each tool allows you to save your work as scenarios. Use the &quot;Load Saved Scenario&quot; dropdown within each tool to reload your saved work.
                      </p>
                    </div>

                    <div className={cn(
                      "bg-blue-50/80 dark:bg-blue-900/30",
                      "backdrop-blur-sm",
                      "p-4 rounded-xl",
                      "border border-blue-200/50 dark:border-blue-800/50"
                    )}>
                      <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 italic">
                        <strong className="text-gray-900 dark:text-white">Note:</strong> For education and planning only. Not legal or FMV advice.
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3 mt-8">
                    <Button
                      onClick={() => {
                        setDialogOpen(false);
                        startTour();
                      }}
                      className="flex-1 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
                    >
                      Take Tour
                    </Button>
                    <Dialog.Close asChild>
                      <Button 
                        variant="outline" 
                        className="flex-1 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
                      >
                        Close
                      </Button>
                    </Dialog.Close>
                  </div>
                  </Dialog.Content>
                </Dialog.Portal>
              </Dialog.Root>

            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={toggleTheme}
              className={cn(
                "min-w-[44px] h-[44px] rounded-full",
                "hover:bg-gray-100/80 dark:hover:bg-gray-800/80",
                "transition-all duration-300 ease-out",
                "active:scale-[0.96]",
                "hover:shadow-sm",
                "group",
                "animate-icon-enter",
                "relative z-20"
              )}
              aria-label="Toggle theme"
              style={{ animationDelay: '0.2s' }}
            >
              <div className="relative w-5 h-5">
                <Sun 
                  className={cn(
                    "absolute inset-0 w-5 h-5 transition-all duration-500 ease-out",
                    theme === 'dark' 
                      ? "opacity-100 rotate-0 scale-100" 
                      : "opacity-0 rotate-90 scale-0"
                  )} 
                />
                <Moon 
                  className={cn(
                    "absolute inset-0 w-5 h-5 transition-all duration-500 ease-out",
                    theme === 'light' 
                      ? "opacity-100 rotate-0 scale-100" 
                      : "opacity-0 -rotate-90 scale-0"
                  )} 
                />
              </div>
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}

