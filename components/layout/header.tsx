'use client';

import { useState, useEffect } from 'react';
import { Sun, Moon, Info, ChevronLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import * as Dialog from '@radix-ui/react-dialog';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import Image from 'next/image';

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
    <div className="relative">
      <Image
        src="/Logo.png"
        alt="CompLens"
        width={40}
        height={40}
        className="w-10 h-10 sm:w-11 sm:h-11 md:w-12 md:h-12 object-contain rounded-xl drop-shadow-lg dark:opacity-80 dark:brightness-90"
        priority
        quality={100}
        unoptimized
      />
      <div className="absolute inset-0 bg-gradient-to-br from-blue-400 via-purple-500 to-green-400 dark:from-blue-500 dark:via-purple-500 dark:to-green-500 rounded-xl opacity-20 dark:opacity-15 blur-sm animate-pulse-slow"></div>
    </div>
  );

  return (
    <header className="fixed top-0 left-0 right-0 z-50 border-b border-gray-200 dark:border-gray-800 bg-gray-50/98 dark:bg-gray-900/98 backdrop-blur-2xl safe-area-inset-top" suppressHydrationWarning>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 md:py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Back button - Apple style (only show when not on home) */}
            {mounted && pathname && pathname !== '/' && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.back()}
                className="min-w-[44px] -ml-2"
                aria-label="Go back"
              >
                <ChevronLeft className="w-5 h-5" />
              </Button>
            )}
            
            {/* Logo - clickable to go home (Apple style) */}
            <Link
              href="/"
              className="flex items-center gap-2 transition-all hover:opacity-80 active:opacity-60 active:scale-95 touch-manipulation cursor-pointer"
              aria-label="Go to home"
              title="Go to home"
            >
              {logoContent}
            </Link>
            
            {/* Page title - Apple style (subtle, in header) */}
            {pageTitle && (
              <h1 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white ml-1 hidden sm:block">
                {pageTitle}
              </h1>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Button 
              variant="ghost" 
              size="sm" 
              className="min-w-[44px]"
              onClick={() => setDialogOpen(true)}
              aria-label="Show instructions"
            >
              <Info className="w-5 h-5" />
            </Button>
            <Dialog.Root open={dialogOpen} onOpenChange={setDialogOpen}>
              <Dialog.Portal>
                <Dialog.Overlay className="fixed inset-0 bg-black/50 z-[100] animate-in fade-in" />
                <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white dark:bg-gray-900 rounded-2xl p-6 max-w-lg w-[90vw] max-h-[85vh] overflow-y-auto z-[101] shadow-xl animate-in fade-in zoom-in-95 duration-200">
                  <Dialog.Title className="text-xl font-bold mb-4">How to Use CompLens™</Dialog.Title>
                  
                  <div className="space-y-4 text-sm text-gray-700 dark:text-gray-300">
                    <div>
                      <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Navigation</h4>
                      <ul className="list-disc list-inside space-y-1 ml-2">
                        <li>Click the <strong>logo</strong> (top-left) to return to home</li>
                        <li>Use the <strong>back button</strong> (chevron) to go back in history</li>
                        <li>On mobile, use the <strong>bottom tabs</strong> to navigate between tools</li>
                      </ul>
                    </div>

                    <div>
                      <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Three Main Tools</h4>
                      <ul className="space-y-2">
                        <li>
                          <strong>wRVU & Incentive Modeler:</strong> Estimate work Relative Value Units and calculate productivity incentives based on FTE and conversion factors.
                        </li>
                        <li>
                          <strong>FMV Calculator:</strong> Perform fast FMV reasonableness checks and percentile analysis across TCC, wRVU, and Conversion Factor metrics.
                        </li>
                        <li>
                          <strong>Call Pay Modeler:</strong> Model call-pay structures with per-call, per-shift, or tiered payment methods and see annualized outputs.
                        </li>
                      </ul>
                    </div>

                    <div>
                      <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Saving Scenarios</h4>
                      <p>Each tool allows you to save your work as scenarios. Use the &quot;Load Saved Scenario&quot; dropdown within each tool to reload your saved work.</p>
                    </div>

                    <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg border border-blue-200 dark:border-blue-800">
                      <p className="text-xs text-gray-600 dark:text-gray-400 italic">
                        <strong>Note:</strong> For education and planning only. Not legal or FMV advice.
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3 mt-6">
                    <Button
                      onClick={() => {
                        setDialogOpen(false);
                        // Dispatch custom event to trigger walkthrough
                        window.dispatchEvent(new CustomEvent('complens:show-walkthrough'));
                      }}
                      className="flex-1"
                    >
                      Take Tour
                    </Button>
                    <Dialog.Close asChild>
                      <Button variant="outline" className="flex-1">Close</Button>
                    </Dialog.Close>
                  </div>
                  </Dialog.Content>
                </Dialog.Portal>
              </Dialog.Root>

            <Button
              variant="ghost"
              size="sm"
              onClick={toggleTheme}
              className="min-w-[44px]"
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? (
                <Sun className="w-5 h-5" />
              ) : (
                <Moon className="w-5 h-5" />
              )}
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}

