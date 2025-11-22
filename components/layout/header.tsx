'use client';

import { useState, useEffect } from 'react';
import { Sun, Moon, Info, Home, ChevronLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import * as Dialog from '@radix-ui/react-dialog';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import Image from 'next/image';

export function Header() {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [mounted, setMounted] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const isHome = mounted && pathname === '/';

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
        alt="Comp Lens"
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
    <header className="fixed top-0 left-0 right-0 z-50 border-b border-gray-200 dark:border-gray-800 bg-white/98 dark:bg-gray-900/98 backdrop-blur-2xl safe-area-inset-top" suppressHydrationWarning>
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
            
            {/* Home button - Apple style (always visible, always clickable) */}
            <button
              onClick={handleLogoClick}
              className="flex items-center gap-2 transition-opacity hover:opacity-80 active:opacity-60 touch-manipulation"
              aria-label="Go to home"
            >
              {logoContent}
            </button>
            
            {/* Home icon button for mobile - more obvious */}
            {mounted && pathname && pathname !== '/' && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push('/')}
                className="min-w-[44px] md:hidden"
                aria-label="Go to home"
              >
                <Home className="w-5 h-5" />
              </Button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Dialog.Root open={dialogOpen} onOpenChange={setDialogOpen}>
              <Dialog.Trigger asChild>
                <Button variant="ghost" size="sm" className="min-w-[44px]">
                  <Info className="w-5 h-5" />
                </Button>
              </Dialog.Trigger>
              <Dialog.Portal>
                <Dialog.Overlay className="fixed inset-0 bg-black/50 z-50" />
                <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white dark:bg-gray-900 rounded-2xl p-6 max-w-md w-[90vw] z-50 shadow-xl">
                  <Dialog.Title className="text-xl font-bold mb-2">About</Dialog.Title>
                  <Dialog.Description className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                    Comp Lens - Provider Compensation Intelligence
                  </Dialog.Description>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                    wRVU modeling, FMV checks, and call-pay scenarios on your phone.
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-500 italic">
                    For education and planning only. Not legal or FMV advice.
                  </p>
                  <Dialog.Close asChild>
                    <Button variant="outline" className="mt-4 w-full">Close</Button>
                  </Dialog.Close>
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

