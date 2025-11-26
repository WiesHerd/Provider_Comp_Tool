'use client';

import { useState, useEffect } from 'react';
import { Sun, Moon, Info, ChevronLeft, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import * as Dialog from '@radix-ui/react-dialog';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import Image from 'next/image';
import { cn } from '@/lib/utils/cn';
import { SCREEN_GUIDES } from '@/lib/screen-guides';

// Page title mapping for header
const getPageTitle = (pathname: string): string | null => {
  if (pathname === '/') return null;
  if (pathname === '/wrvu-modeler') return 'Productivity Incentive Calculator';
  if (pathname === '/fmv-calculator') return 'FMV Calculator';
  if (pathname.startsWith('/fmv-calculator/wrvu')) return 'wRVU Calculator';
  if (pathname.startsWith('/fmv-calculator/tcc')) return 'TCC Calculator';
  if (pathname.startsWith('/fmv-calculator/cf')) return 'CF Calculator';
  if (pathname === '/call-pay-modeler') return 'Call Pay Modeler';
  if (pathname === '/scenarios') return 'Scenarios';
  if (pathname.startsWith('/scenarios/')) return 'Edit Scenario';
  return null;
};

// Get screen guide based on pathname
const getScreenGuide = (pathname: string) => {
  if (pathname === '/') {
    return SCREEN_GUIDES.home;
  } else if (pathname === '/wrvu-modeler') {
    return SCREEN_GUIDES.wrvuModeler;
  } else if (pathname === '/fmv-calculator' || pathname.startsWith('/fmv-calculator/')) {
    return SCREEN_GUIDES.fmvCalculator;
  } else if (pathname === '/call-pay-modeler') {
    return SCREEN_GUIDES.callPayModeler;
  } else if (pathname === '/wrvu-forecaster') {
    return SCREEN_GUIDES.wrvuForecaster;
  } else if (pathname === '/scenarios') {
    return SCREEN_GUIDES.scenarios;
  }
  return SCREEN_GUIDES.home; // Default to home
};

// Parse description text into formatted React elements (simplified version)
function parseDescription(description: string): React.ReactNode[] {
  if (!description || typeof description !== 'string') {
    return [];
  }
  
  const normalizedDescription = description.replace(/\\n/g, '\n');
  const lines = normalizedDescription.split(/\r?\n/);
  const elements: React.ReactNode[] = [];
  let currentList: React.ReactNode[] = [];
  let inList = false;

  const flushList = () => {
    if (currentList.length > 0) {
      elements.push(
        <ul key={`list-${elements.length}`} className="list-disc list-outside space-y-2 ml-5 pl-1 text-gray-700 dark:text-gray-300">
          {currentList}
        </ul>
      );
      currentList = [];
      inList = false;
    }
  };

  const processBoldText = (text: string): React.ReactNode[] => {
    const parts: React.ReactNode[] = [];
    const boldRegex = /\*\*([^*]+)\*\*/g;
    let lastIndex = 0;
    let match;

    while ((match = boldRegex.exec(text)) !== null) {
      if (match.index > lastIndex) {
        parts.push(text.substring(lastIndex, match.index));
      }
      parts.push(
        <strong key={`bold-${match.index}`} className="text-gray-900 dark:text-white">
          {match[1]}
        </strong>
      );
      lastIndex = match.index + match[0].length;
    }

    if (lastIndex < text.length) {
      parts.push(text.substring(lastIndex));
    }

    return parts.length > 0 ? parts : [text];
  };

  lines.forEach((line, index) => {
    const trimmedLine = line.trim();
    
    if (trimmedLine === '') {
      if (inList) {
        flushList();
      }
      return;
    }

    // Handle headers (## Header)
    if (trimmedLine.startsWith('## ')) {
      flushList();
      const headerText = trimmedLine.substring(3).trim();
      elements.push(
        <h3
          key={`header-${index}`}
          className={cn(
            "font-semibold text-gray-900 dark:text-white mb-4 mt-6 first:mt-0",
            "text-lg sm:text-xl"
          )}
        >
          {headerText}
        </h3>
      );
      return;
    }

    // Handle subheaders (### Subheader)
    if (trimmedLine.startsWith('### ')) {
      flushList();
      const subheaderText = trimmedLine.substring(4).trim();
      elements.push(
        <h4
          key={`subheader-${index}`}
          className={cn(
            "font-semibold text-gray-900 dark:text-white mb-3 mt-5 first:mt-0",
            "text-base sm:text-lg"
          )}
        >
          {subheaderText}
        </h4>
      );
      return;
    }

    // Handle bullet points
    const bulletMatch = trimmedLine.match(/^[\u2022\-\*]|^\s{2,}[\u2022\-\*]/);
    if (bulletMatch) {
      if (!inList) {
        inList = true;
      }
      const content = trimmedLine.replace(/^[\u2022\-\*]\s*|^\s{2,}[\u2022\-\*]\s*/, '').trim();
      const processedContent = processBoldText(content);
      currentList.push(
        <li key={`bullet-${index}`} className="leading-relaxed">
          {processedContent}
        </li>
      );
      return;
    }

    // If we hit a non-list item while in a list, flush it
    if (inList) {
      flushList();
    }

    // Handle regular paragraphs
    const processedContent = processBoldText(trimmedLine);
    elements.push(
      <p key={`para-${index}`} className="text-gray-700 dark:text-gray-300 mb-3 leading-relaxed last:mb-0">
        {processedContent}
      </p>
    );
  });

  // Flush any remaining lists
  flushList();

  return elements;
}

export function Header() {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [mounted, setMounted] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [isHeaderVisible, setIsHeaderVisible] = useState(true);
  const [isLandscape, setIsLandscape] = useState(false);
  const [lastScrollY, setLastScrollY] = useState(0);
  const pathname = usePathname();
  const router = useRouter();
  // Ensure consistent pathname for SSR - use pathname directly, not conditional on mounted
  const safePathname = pathname || '/';
  const isHome = safePathname === '/';
  const pageTitle = safePathname ? getPageTitle(safePathname) : null;

  // Function to open the tour/guide modal for current screen
  const openScreenGuide = () => {
    if (typeof window === 'undefined') return;
    
    // Determine which guide to show based on current path
    // Use safePathname for consistent behavior
    let storageKey = SCREEN_GUIDES.home.storageKey; // default to home
    
    if (safePathname === '/') {
      storageKey = SCREEN_GUIDES.home.storageKey;
    } else if (safePathname === '/wrvu-modeler') {
      storageKey = SCREEN_GUIDES.wrvuModeler.storageKey;
    } else if (safePathname === '/fmv-calculator' || safePathname.startsWith('/fmv-calculator/')) {
      storageKey = SCREEN_GUIDES.fmvCalculator.storageKey;
    } else if (safePathname === '/call-pay-modeler') {
      storageKey = SCREEN_GUIDES.callPayModeler.storageKey;
    } else if (safePathname === '/wrvu-forecaster') {
      storageKey = SCREEN_GUIDES.wrvuForecaster.storageKey;
    } else if (safePathname === '/provider-wrvu-tracking') {
      storageKey = SCREEN_GUIDES.providerWRVUTracking.storageKey;
    } else if (safePathname === '/scenarios') {
      storageKey = SCREEN_GUIDES.scenarios.storageKey;
    }
    
    // Dispatch event to open the modal
    const eventName = `${storageKey}-open`;
    window.dispatchEvent(new CustomEvent(eventName));
  };

  useEffect(() => {
    setMounted(true);
    const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    const storedTheme = localStorage.getItem('theme') as 'light' | 'dark' | null;
    const initialTheme = storedTheme || systemTheme;
    setTheme(initialTheme);
    document.documentElement.classList.toggle('dark', initialTheme === 'dark');
  }, []);

  // Detect landscape orientation
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const checkOrientation = () => {
      const isLandscapeMode = window.matchMedia('(orientation: landscape)').matches && window.innerWidth < 1024;
      setIsLandscape(isLandscapeMode);
    };

    checkOrientation();
    const mediaQuery = window.matchMedia('(orientation: landscape)');
    mediaQuery.addEventListener('change', checkOrientation);
    window.addEventListener('resize', checkOrientation);

    return () => {
      mediaQuery.removeEventListener('change', checkOrientation);
      window.removeEventListener('resize', checkOrientation);
    };
  }, []);

  // Scroll-based auto-hide header (Safari-style)
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      
      // Always show header at top of page
      if (currentScrollY === 0) {
        setIsHeaderVisible(true);
        setLastScrollY(currentScrollY);
        return;
      }

      // Hide when scrolling down, show when scrolling up
      if (currentScrollY > lastScrollY && currentScrollY > 50) {
        setIsHeaderVisible(false);
      } else if (currentScrollY < lastScrollY) {
        setIsHeaderVisible(true);
      }

      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    document.documentElement.classList.toggle('dark', newTheme === 'dark');
  };

  const handleLogoClick = (e: React.MouseEvent) => {
    if (!mounted) return;
    if (safePathname === '/') {
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
        src="/New Image.png"
        alt="CompLens"
        width={44}
        height={44}
        className="w-11 h-11 sm:w-12 sm:h-12 md:w-14 md:h-14 object-contain rounded-2xl transition-all duration-200 relative z-10"
        style={{
          filter: 'drop-shadow(0 2px 12px rgba(0, 0, 0, 0.08)) drop-shadow(0 1px 4px rgba(0, 0, 0, 0.06))',
        }}
        priority
        quality={100}
        unoptimized
      />
      {/* Enhanced subtle background glow - Grok style */}
      <div 
        className="absolute inset-0 bg-gradient-to-br from-blue-400/20 via-purple-400/15 to-green-400/20 dark:from-blue-500/25 dark:via-purple-500/20 dark:to-green-500/25 rounded-2xl blur-xl"
      />
    </div>
  );

  return (
    <>
      {/* Skip to main content link - always render for consistent hydration */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[100] focus:px-4 focus:py-2 focus:bg-primary focus:text-white focus:rounded-lg focus:font-semibold focus:ring-2 focus:ring-primary focus:ring-offset-2"
        aria-label="Skip to main content"
        suppressHydrationWarning
      >
        Skip to main content
      </a>
      <header 
        className={cn(
          "fixed top-0 left-0 right-0 z-50 safe-area-inset-top",
          "border-b transition-all duration-500 ease-out",
          "border-gray-200/40 dark:border-gray-800/40",
          "bg-white/75 dark:bg-gray-950/75",
          "backdrop-blur-xl backdrop-saturate-200",
          "shadow-[0_1px_0_0_rgba(0,0,0,0.03),0_4px_24px_rgba(0,0,0,0.02)] dark:shadow-[0_1px_0_0_rgba(255,255,255,0.03),0_4px_24px_rgba(0,0,0,0.3)]",
          "supports-[backdrop-filter]:bg-white/65 supports-[backdrop-filter]:dark:bg-gray-950/65",
          isHeaderVisible ? "translate-y-0 opacity-100" : "-translate-y-full opacity-0",
          isLandscape ? "py-2 md:py-2" : "py-2 sm:py-2.5 md:py-3"
        )}
        suppressHydrationWarning
        role="banner"
      >
      {/* Enhanced gradient overlay - Grok style */}
      <div className="absolute inset-0 bg-gradient-to-b from-white/60 via-white/30 to-transparent dark:from-gray-950/60 dark:via-gray-950/30 pointer-events-none" />
      <div className="absolute inset-0 bg-gradient-to-r from-blue-500/0 via-purple-500/5 to-pink-500/0 dark:from-blue-400/0 dark:via-purple-400/8 dark:to-pink-400/0 pointer-events-none" />
      
      <div className={cn(
        "relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 z-10",
        isLandscape ? "py-1.5" : "py-1 sm:py-1.5"
      )}>
        <div className="flex items-center justify-between relative z-10">
          <div className={cn(
            "flex items-center",
            isLandscape ? "gap-3 sm:gap-4" : "gap-5 sm:gap-6 md:gap-7"
          )}>
            {/* Back button - Grok style (only show when not on home) */}
            {/* Use safePathname for consistent SSR rendering */}
            {safePathname !== '/' && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.back()}
                className={cn(
                  "min-w-[44px] h-[44px] -ml-1 rounded-xl",
                  "hover:bg-gray-100/90 dark:hover:bg-gray-800/90",
                  "transition-all duration-200 ease-out",
                  "active:scale-[0.95]",
                  "hover:shadow-md hover:shadow-gray-200/50 dark:hover:shadow-gray-900/50",
                  "animate-icon-enter",
                  "border border-transparent hover:border-gray-200/50 dark:hover:border-gray-700/50"
                )}
                aria-label="Go back"
                suppressHydrationWarning
              >
                <ChevronLeft className="w-6 h-6 sm:w-5 sm:h-5 text-gray-600 dark:text-gray-400 transition-transform duration-200 group-hover:-translate-x-0.5" />
              </Button>
            )}
            
            {/* Logo - clickable to go home - Grok style */}
            <Link
              href="/"
              className={cn(
                "flex items-center gap-4 sm:gap-5",
                "transition-all duration-200 ease-out",
                "hover:opacity-85 active:opacity-75",
                "active:scale-[0.97]",
                "touch-manipulation cursor-pointer"
              )}
              aria-label="Go to home"
              title="Go to home"
              suppressHydrationWarning
            >
              {logoContent}
            </Link>
            
            {/* Page title - Grok style (refined typography) */}
            {pageTitle && (
              <h1 className={cn(
                isLandscape ? "text-sm sm:text-base" : "text-lg sm:text-xl md:text-2xl",
                "font-medium text-gray-900 dark:text-gray-100",
                "ml-0.5 hidden sm:block",
                "tracking-[-0.02em]",
                "animate-fade-in",
                "transition-opacity duration-300",
                "leading-tight"
              )} suppressHydrationWarning>
                {pageTitle}
              </h1>
            )}
          </div>

          <div className={cn(
            "flex items-center relative z-20",
            isLandscape ? "gap-2 sm:gap-3" : "gap-3 sm:gap-4"
          )}>
            {(!isLandscape || (typeof window !== 'undefined' && window.innerWidth >= 640)) && (
              <>
                <Button 
                  type="button"
                  variant="ghost" 
                  size="sm" 
                  className={cn(
                    "min-w-[44px] h-[44px]",
                    "rounded-xl",
                    "hover:bg-gray-100/90 dark:hover:bg-gray-800/90",
                    "transition-all duration-200 ease-out",
                    "active:scale-[0.95]",
                    "hover:shadow-md hover:shadow-gray-200/50 dark:hover:shadow-gray-900/50",
                    "group",
                    "animate-icon-enter",
                    "border border-transparent hover:border-gray-200/50 dark:hover:border-gray-700/50",
                    "relative z-20"
                  )}
                  onClick={openScreenGuide}
                  aria-label={isHome ? "Take tour" : "Show help"}
                  title={isHome ? "Take tour" : "Show help"}
                  style={{ animationDelay: '0.1s' }}
                  suppressHydrationWarning
                >
                  <Sparkles className={cn(
                    "w-6 h-6 sm:w-5 sm:h-5 text-gray-600 dark:text-gray-400",
                    "transition-all duration-200",
                    "group-hover:scale-110 group-hover:text-gray-900 dark:group-hover:text-gray-200",
                    "group-hover:animate-sparkle-pulse"
                  )} />
                </Button>
                <Button 
                  type="button"
                  variant="ghost" 
                  size="sm" 
                  className={cn(
                    "min-w-[44px] h-[44px]",
                    "rounded-xl",
                    "hover:bg-gray-100/90 dark:hover:bg-gray-800/90",
                    "transition-all duration-200 ease-out",
                    "active:scale-[0.95]",
                    "hover:shadow-md hover:shadow-gray-200/50 dark:hover:shadow-gray-900/50",
                    "group",
                    "animate-icon-enter",
                    "border border-transparent hover:border-gray-200/50 dark:hover:border-gray-700/50",
                    "relative z-20"
                  )}
                  onClick={() => {
                    setDialogOpen(true);
                  }}
                  aria-label="Show instructions"
                  style={{ animationDelay: '0.15s' }}
                  suppressHydrationWarning
                >
                  <Info className={cn(
                    "w-6 h-6 sm:w-5 sm:h-5 text-gray-600 dark:text-gray-400",
                    "transition-all duration-200",
                    "group-hover:scale-110 group-hover:text-gray-900 dark:group-hover:text-gray-200"
                  )} />
                </Button>
              </>
            )}
            <Dialog.Root open={dialogOpen} onOpenChange={setDialogOpen}>
              <Dialog.Portal>
                <Dialog.Overlay 
                  className={cn(
                    "fixed inset-0 z-[100]",
                    "bg-black/50 dark:bg-black/70",
                    "backdrop-blur-md",
                    "animate-in fade-in duration-300",
                    "transition-opacity"
                  )} 
                />
                <Dialog.Content 
                  className={cn(
                    "fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2",
                    "bg-white/95 dark:bg-gray-950/95",
                    "backdrop-blur-xl backdrop-saturate-200",
                    "rounded-2xl p-6 sm:p-8 md:p-10",
                    "max-w-lg w-[90vw] max-h-[85vh]",
                    "overflow-y-auto z-[101]",
                    "shadow-2xl shadow-gray-900/10 dark:shadow-gray-900/50",
                    "border border-gray-200/60 dark:border-gray-800/60",
                    "animate-in fade-in zoom-in-95 duration-300",
                    "supports-[backdrop-filter]:bg-white/90 supports-[backdrop-filter]:dark:bg-gray-950/90"
                  )}
                >
                  {(() => {
                    const screenGuide = safePathname ? getScreenGuide(safePathname) : SCREEN_GUIDES.home;
                    const isHome = safePathname === '/';
                    
                    // On home, show full app info; on other screens, show screen-specific info
                    return (
                      <>
                        <Dialog.Title className={cn(
                          "text-2xl sm:text-3xl md:text-4xl font-medium mb-6 md:mb-8",
                          "text-gray-900 dark:text-gray-100",
                          "tracking-[-0.02em]",
                          "leading-tight"
                        )}>
                          {isHome ? 'How to Use CompLens™' : screenGuide.title}
                        </Dialog.Title>
                        
                        <div className="space-y-5 sm:space-y-6 text-sm sm:text-base leading-relaxed">
                          {isHome ? (
                            // Home screen: Show full app information
                            <>
                              <div>
                                <h4 className={cn(
                                  "font-semibold text-gray-900 dark:text-white mb-3",
                                  "text-base sm:text-lg"
                                )}>
                                  Navigation
                                </h4>
                                <ul className="list-disc list-outside space-y-2 ml-5 pl-1 text-gray-700 dark:text-gray-300">
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
                                <ul className="space-y-3 text-gray-700 dark:text-gray-300">
                                  <li>
                                    <strong className="text-gray-900 dark:text-white">Productivity Incentive Calculator:</strong> Calculate productivity-based compensation and incentives based on FTE and conversion factors.
                                  </li>
                                  <li>
                                    <strong className="text-gray-900 dark:text-white">FMV Calculator:</strong> Perform fast FMV reasonableness checks and percentile analysis across TCC, wRVU, and Conversion Factor metrics.
                                  </li>
                                  <li>
                                    <strong className="text-gray-900 dark:text-white">Call Pay Modeler:</strong> Model call-pay structures with per-call, per-shift, or tiered payment methods and see annualized outputs.
                                  </li>
                                  <li>
                                    <strong className="text-gray-900 dark:text-white">Schedule-Based Productivity Calculator:</strong> Forecast annual productivity and compensation based on your work schedule and patient load.
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
                                <p className="text-gray-700 dark:text-gray-300">
                                  Each tool allows you to save your work as scenarios. Use the &quot;Load Saved Scenario&quot; dropdown within each tool to reload your saved work.
                                </p>
                              </div>
                            </>
                          ) : (
                            // Other screens: Show screen-specific information
                            <div className="space-y-4">
                              {parseDescription(screenGuide.description)}
                            </div>
                          )}

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
                              openScreenGuide();
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
                      </>
                    );
                  })()}
                  </Dialog.Content>
                </Dialog.Portal>
              </Dialog.Root>

            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={toggleTheme}
              className={cn(
                "min-w-[44px] h-[44px]",
                "rounded-xl",
                "hover:bg-gray-100/90 dark:hover:bg-gray-800/90",
                "transition-all duration-200 ease-out",
                "active:scale-[0.95]",
                "hover:shadow-md hover:shadow-gray-200/50 dark:hover:shadow-gray-900/50",
                "group",
                "animate-icon-enter",
                "border border-transparent hover:border-gray-200/50 dark:hover:border-gray-700/50",
                "relative z-20"
              )}
              aria-label="Toggle theme"
              style={{ animationDelay: '0.2s' }}
              suppressHydrationWarning
            >
              <div className="relative w-6 h-6 sm:w-5 sm:h-5">
                <Sun 
                  className={cn(
                    "absolute inset-0 w-6 h-6 sm:w-5 sm:h-5 transition-all duration-300 ease-out",
                    "text-gray-600 dark:text-gray-400",
                    "group-hover:text-gray-900 dark:group-hover:text-gray-200",
                    theme === 'dark' 
                      ? "opacity-100 rotate-0 scale-100" 
                      : "opacity-0 rotate-90 scale-0"
                  )} 
                />
                <Moon 
                  className={cn(
                    "absolute inset-0 w-6 h-6 sm:w-5 sm:h-5 transition-all duration-300 ease-out",
                    "text-gray-600 dark:text-gray-400",
                    "group-hover:text-gray-900 dark:group-hover:text-gray-200",
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
    </>
  );
}

