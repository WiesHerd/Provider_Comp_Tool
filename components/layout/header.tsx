'use client';

import { useState, useEffect } from 'react';
import { Sun, Moon, Info, ChevronLeft, Upload, LogOut, User, Zap, Clock, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import * as Dialog from '@radix-ui/react-dialog';
import * as DropdownMenuPrimitive from '@radix-ui/react-dropdown-menu';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import Image from 'next/image';
import { cn } from '@/lib/utils/cn';
import { SCREEN_GUIDES } from '@/lib/screen-guides';
import { useAuthStore } from '@/lib/store/auth-store';
import { useTrialStatus } from '@/hooks/use-trial-status';
import { isOwnerEmail } from '@/lib/utils/trial-status';

// Dropdown menu components (Radix UI)
const DropdownMenuRoot = DropdownMenuPrimitive.Root as any;
const DropdownMenuTrigger = DropdownMenuPrimitive.Trigger as any;
const DropdownMenuPortal = DropdownMenuPrimitive.Portal as any;
const DropdownMenuContent = DropdownMenuPrimitive.Content as any;
const DropdownMenuItem = DropdownMenuPrimitive.Item as any;
const DropdownMenuSeparator = DropdownMenuPrimitive.Separator as any;

// Page title mapping for header
// Note: Page titles removed from header to match gold standard - no screen titles in banner
const getPageTitle = (_pathname: string): string | null => {
  // Return null for all pages - no titles in header banner
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

import { parseDescription } from '@/lib/utils/text-parser';

export function Header() {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [isHeaderVisible, setIsHeaderVisible] = useState(true);
  const [isLandscape, setIsLandscape] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout, loading: authLoading } = useAuthStore();
  const { isTrialActive, daysRemaining, needsUpgrade, hasValidSubscription } = useTrialStatus();
  const isOwner = isOwnerEmail(user?.email || null);
  // Ensure consistent pathname for SSR - use pathname directly, not conditional on mounted
  const safePathname = pathname || '/';
  
  // Don't show header on auth page.
  // In static export + client-only layout, `usePathname()` can be briefly undefined on first paint,
  // which can cause a markup mismatch if we render the header and then remove it.
  const currentPath =
    pathname || (typeof window !== 'undefined' ? window.location.pathname : '');
  // IMPORTANT: do not early-return before hooks; logout can redirect to /auth which would change
  // the number of hooks executed and crash with "Rendered fewer hooks than expected".
  const shouldHideHeader = currentPath === '/auth' || currentPath === '/auth.html';
  const isHome = (currentPath || safePathname) === '/';
  const pageTitle = safePathname ? getPageTitle(safePathname) : null;

  useEffect(() => {
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
  // Optimized with requestAnimationFrame for better performance
  useEffect(() => {
    if (typeof window === 'undefined') return;

    let ticking = false;
    let lastScrollY = window.scrollY;

    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const currentScrollY = window.scrollY;
          
          // Always show header at top of page
          if (currentScrollY === 0) {
            setIsHeaderVisible(true);
            lastScrollY = currentScrollY;
            ticking = false;
            return;
          }

          // Hide when scrolling down, show when scrolling up
          if (currentScrollY > lastScrollY && currentScrollY > 50) {
            setIsHeaderVisible(false);
          } else if (currentScrollY < lastScrollY) {
            setIsHeaderVisible(true);
          }

          lastScrollY = currentScrollY;
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    document.documentElement.classList.toggle('dark', newTheme === 'dark');
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

  if (shouldHideHeader) return null;

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
          "backdrop-blur-lg sm:backdrop-blur-xl backdrop-saturate-150 sm:backdrop-saturate-200",
          "shadow-[0_1px_0_0_rgba(0,0,0,0.03),0_4px_24px_rgba(0,0,0,0.02)] dark:shadow-[0_1px_0_0_rgba(255,255,255,0.03),0_4px_24px_rgba(0,0,0,0.3)]",
          "supports-[backdrop-filter]:bg-white/70 supports-[backdrop-filter]:dark:bg-gray-950/70",
          "supports-[backdrop-filter]:sm:bg-white/65 supports-[backdrop-filter]:sm:dark:bg-gray-950/65",
          isHeaderVisible ? "translate-y-0 opacity-100" : "-translate-y-full opacity-0",
          isLandscape ? "py-2 md:py-2" : "py-2 sm:py-2.5 md:py-3"
        )}
        suppressHydrationWarning
        role="banner"
      >
      {/* Enhanced gradient overlay - more subtle on mobile */}
      <div className="absolute inset-0 bg-gradient-to-b from-white/50 via-white/20 to-transparent dark:from-gray-950/50 dark:via-gray-950/20 sm:from-white/60 sm:via-white/30 sm:dark:from-gray-950/60 sm:dark:via-gray-950/30 pointer-events-none" />
      <div className="absolute inset-0 bg-gradient-to-r from-blue-500/0 via-purple-500/3 to-pink-500/0 dark:from-blue-400/0 dark:via-purple-400/5 dark:to-pink-400/0 sm:via-purple-500/5 sm:dark:via-purple-400/8 pointer-events-none" />
      
      <div className={cn(
        "relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 z-10",
        isLandscape ? "py-1.5" : "py-1 sm:py-1.5"
      )}>
        <div className="flex items-center justify-between relative z-10">
          <div className={cn(
            "flex items-center",
            isLandscape ? "gap-3 sm:gap-4" : "gap-4 sm:gap-5 md:gap-6"
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
                  "active:bg-gray-200/90 dark:active:bg-gray-700/90",
                  "transition-all duration-200 ease-out",
                  "active:scale-[0.92] touch-manipulation",
                  "hover:shadow-md hover:shadow-gray-200/50 dark:hover:shadow-gray-900/50",
                  "active:shadow-sm",
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
              {/* CompLens branding - hide on home page (shown in main content), show on other pages */}
              {!isHome && (
                <span 
                  className={cn(
                    "flex items-baseline",
                    "text-base sm:text-lg lg:text-xl font-bold",
                    "tracking-tight",
                    "animate-fade-in",
                    "transition-opacity duration-300",
                    "ml-2 sm:ml-3",
                    "transform -skew-x-[-2deg]",
                    "leading-tight",
                    // Hide on mobile when there's a page title to avoid clutter
                    pageTitle ? "hidden sm:flex" : "flex"
                  )} 
                  suppressHydrationWarning
                >
                  <span className="text-gray-900 dark:text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.1)] dark:drop-shadow-[0_1px_2px_rgba(0,0,0,0.3)]">Comp</span>
                  <span className="text-purple-600 dark:text-purple-200 drop-shadow-[0_1px_2px_rgba(0,0,0,0.1)] dark:drop-shadow-[0_1px_2px_rgba(0,0,0,0.2)]">Lens</span>
                  <sup className="text-[10px] sm:text-xs font-normal text-gray-900 dark:text-white opacity-90 ml-0.5 -skew-x-[2deg]">™</sup>
                </span>
              )}
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
            isLandscape ? "gap-2 sm:gap-3" : "gap-2 sm:gap-3"
          )}>
            {/* Trial status indicator */}
            {user && !authLoading && (
              <>
                {!isOwner && isTrialActive && daysRemaining > 0 && (
                  <Link href="/pricing">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className={cn(
                        "min-w-[44px] h-[44px] sm:min-w-auto sm:px-3",
                        "rounded-xl",
                        daysRemaining <= 3 
                          ? "bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800 text-orange-700 dark:text-orange-300"
                          : "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300",
                        "hover:bg-opacity-80 dark:hover:bg-opacity-80",
                        "transition-all duration-200 ease-out",
                        "active:scale-[0.92] touch-manipulation",
                        "hover:shadow-md",
                        "group",
                        "animate-icon-enter",
                        "text-xs sm:text-sm font-medium"
                      )}
                      aria-label={`${daysRemaining} days left in trial`}
                      title={`${daysRemaining} days left in trial`}
                      suppressHydrationWarning
                    >
                      <Clock className="w-4 h-4 sm:mr-1.5" />
                      <span className="hidden sm:inline">
                        {daysRemaining} {daysRemaining === 1 ? 'day' : 'days'} left
                      </span>
                    </Button>
                  </Link>
                )}
                {!isOwner && needsUpgrade && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className={cn(
                      "min-w-[44px] h-[44px] sm:min-w-auto sm:px-3",
                      "rounded-xl",
                      "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-700 dark:text-red-300",
                      "hover:bg-red-100 dark:hover:bg-red-900/30",
                      "transition-all duration-200 ease-out",
                      "active:scale-[0.92] touch-manipulation",
                      "hover:shadow-md",
                      "group",
                      "animate-icon-enter",
                      "text-xs sm:text-sm font-medium"
                    )}
                    aria-label="Trial expired - Upgrade now"
                    title="Trial expired - Upgrade now"
                    suppressHydrationWarning
                    onClick={() => {
                      if (typeof window !== 'undefined') {
                        window.dispatchEvent(new CustomEvent('complens:upgrade-required'));
                      } else {
                        router.push('/pricing');
                      }
                    }}
                  >
                    <AlertCircle className="w-4 h-4 sm:mr-1.5" />
                    <span className="hidden sm:inline">Trial Expired</span>
                  </Button>
                )}
                {hasValidSubscription && !isTrialActive && (
                  <div className="hidden sm:flex items-center gap-1.5 px-2 py-1 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
                    <Zap className="w-3 h-3 text-green-600 dark:text-green-400" />
                    <span className="text-xs font-medium text-green-700 dark:text-green-300">
                      {isOwner ? 'Owner' : 'Pro'}
                    </span>
                  </div>
                )}
              </>
            )}

            {/* Pricing button - visible to all users */}
            {safePathname !== '/pricing' && (
              <Link href="/pricing">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className={cn(
                    "min-w-[44px] h-[44px] sm:min-w-auto sm:px-4",
                    "rounded-xl",
                    "hover:bg-purple-50/80 dark:hover:bg-purple-950/30",
                    "active:bg-purple-100/80 dark:active:bg-purple-900/40",
                    "transition-all duration-200 ease-out",
                    "active:scale-[0.92] touch-manipulation",
                    "hover:shadow-md hover:shadow-purple-200/30 dark:hover:shadow-purple-900/20",
                    "active:shadow-sm",
                    "group",
                    "animate-icon-enter",
                    "border border-transparent hover:border-purple-200/40 dark:hover:border-purple-800/40"
                  )}
                  aria-label="Pricing"
                  title="View Pricing"
                  suppressHydrationWarning
                >
                  <Zap className="w-5 h-5 sm:mr-2 text-purple-600 dark:text-purple-400 group-hover:text-purple-700 dark:group-hover:text-purple-300" />
                  <span className="hidden sm:inline text-sm font-medium text-purple-600 dark:text-purple-400 group-hover:text-purple-700 dark:group-hover:text-purple-300">
                    Pricing
                  </span>
                </Button>
              </Link>
            )}

            {/* User menu - Google/Apple style dropdown */}
            {user && !authLoading && (
              <DropdownMenuRoot>
                <DropdownMenuTrigger asChild>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className={cn(
                      "min-w-[44px] h-[44px]",
                      "rounded-full", // Circular like Google/Apple
                      "bg-gray-100/80 dark:bg-gray-800/80",
                      "hover:bg-gray-200/80 dark:hover:bg-gray-700/80",
                      "active:bg-gray-300/80 dark:active:bg-gray-600/80",
                      "transition-all duration-200 ease-out",
                      "active:scale-[0.95] touch-manipulation",
                      "hover:shadow-md hover:shadow-gray-200/50 dark:hover:shadow-gray-900/50",
                      "active:shadow-sm",
                      "border border-gray-200/50 dark:border-gray-700/50",
                      "focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                    )}
                    aria-label="Account menu"
                    title={user.email || "Account"}
                    suppressHydrationWarning
                  >
                    <User className="w-5 h-5 text-gray-700 dark:text-gray-300" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuPortal>
                  <DropdownMenuContent
                    className={cn(
                      "min-w-[240px] bg-white dark:bg-gray-900 rounded-lg shadow-xl border border-gray-200 dark:border-gray-800 p-1 z-50",
                      "animate-in fade-in-0 zoom-in-95 duration-200"
                    )}
                    align="end"
                    sideOffset={8}
                  >
                    {/* User email header */}
                    <div className="px-3 py-2 border-b border-gray-200 dark:border-gray-800">
                      <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                        Signed in as
                      </p>
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                        {user.email}
                      </p>
                    </div>
                    
                    <DropdownMenuSeparator className="h-px bg-gray-200 dark:bg-gray-800 my-1" />
                    
                    {/* Pricing link */}
                    <Link href="/pricing">
                      <DropdownMenuItem
                        className={cn(
                          "flex items-center px-3 py-2 text-sm text-gray-700 dark:text-gray-300 rounded-md cursor-pointer",
                          "hover:bg-gray-100 dark:hover:bg-gray-800 outline-none",
                          "focus:bg-gray-100 dark:focus:bg-gray-800"
                        )}
                      >
                        <Zap className="w-4 h-4 mr-2" />
                        Pricing
                      </DropdownMenuItem>
                    </Link>
                    
                    <DropdownMenuSeparator className="h-px bg-gray-200 dark:bg-gray-800 my-1" />
                    
                    {/* Sign out option */}
                    <DropdownMenuItem
                      className={cn(
                        "flex items-center px-3 py-2 text-sm text-red-600 dark:text-red-400 rounded-md cursor-pointer",
                        "hover:bg-red-50 dark:hover:bg-red-900/20 outline-none",
                        "focus:bg-red-50 dark:focus:bg-red-900/20"
                      )}
                      onClick={async () => {
                        try {
                          await logout();
                        } catch {
                          // If sign out fails, keep the user on /auth and let them sign in again.
                        }
                        // Let the RouteGuard handle redirects based on auth state.
                        // We avoid hard navigations here because they can race with React unmounts
                        // (dropdown closing, auth store updates) and trigger runtime errors.
                        router.replace('/auth');
                      }}
                    >
                      <LogOut className="w-4 h-4 mr-2" />
                      Sign out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenuPortal>
              </DropdownMenuRoot>
            )}
            
            {/* Sign in button - show when not logged in */}
            {!user && !authLoading && safePathname !== '/auth' && (
              <Link href="/auth">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className={cn(
                    "min-w-[44px] h-[44px] sm:min-w-auto sm:px-4",
                    "rounded-xl",
                    "hover:bg-blue-50/80 dark:hover:bg-blue-950/30",
                    "active:bg-blue-100/80 dark:active:bg-blue-900/40",
                    "transition-all duration-200 ease-out",
                    "active:scale-[0.92] touch-manipulation",
                    "hover:shadow-md hover:shadow-blue-200/30 dark:hover:shadow-blue-900/20",
                    "active:shadow-sm",
                    "group",
                    "animate-icon-enter",
                    "border border-transparent hover:border-blue-200/40 dark:hover:border-blue-800/40"
                  )}
                  aria-label="Sign in"
                  title="Sign in"
                  suppressHydrationWarning
                >
                  <User className="w-5 h-5 sm:mr-2 text-blue-600 dark:text-blue-400 group-hover:text-blue-700 dark:group-hover:text-blue-300" />
                  <span className="hidden sm:inline text-sm font-medium text-blue-600 dark:text-blue-400 group-hover:text-blue-700 dark:group-hover:text-blue-300">
                    Sign In
                  </span>
                </Button>
              </Link>
            )}

            {(!isLandscape || (typeof window !== 'undefined' && window.innerWidth >= 640)) && (
              <>
                {/* Upload button - hidden on mobile */}
                <Link href="/market-data?upload=true" className="hidden sm:block">
                  <Button 
                    type="button"
                    variant="ghost" 
                    size="sm" 
                    className={cn(
                      "min-w-[44px] h-[44px]",
                      "rounded-xl",
                      "hover:bg-blue-50/80 dark:hover:bg-blue-950/30",
                      "active:bg-blue-100/80 dark:active:bg-blue-900/40",
                      "transition-all duration-200 ease-out",
                      "active:scale-[0.92] touch-manipulation",
                      "hover:shadow-md hover:shadow-blue-200/30 dark:hover:shadow-blue-900/20",
                      "active:shadow-sm",
                      "group",
                      "animate-icon-enter",
                      "border border-transparent hover:border-blue-200/40 dark:hover:border-blue-800/40",
                      "relative z-20"
                    )}
                    aria-label="Upload Market Data"
                    title="Upload Market Data"
                    style={{ animationDelay: '0.1s' }}
                    suppressHydrationWarning
                  >
                    <Upload className={cn(
                      "w-5 h-5 text-blue-600 dark:text-blue-400",
                      "transition-all duration-200",
                      "group-hover:scale-110 group-hover:text-blue-700 dark:group-hover:text-blue-300"
                    )} />
                  </Button>
                </Link>
                {/* Info button - slightly more prominent for help/guidance */}
                <Button 
                  type="button"
                  variant="ghost" 
                  size="sm" 
                  className={cn(
                    "min-w-[44px] h-[44px]",
                    "rounded-xl",
                    "hover:bg-blue-50/80 dark:hover:bg-blue-950/30",
                    "active:bg-blue-100/80 dark:active:bg-blue-900/40",
                    "transition-all duration-200 ease-out",
                    "active:scale-[0.92] touch-manipulation",
                    "hover:shadow-md hover:shadow-blue-200/30 dark:hover:shadow-blue-900/20",
                    "active:shadow-sm",
                    "group",
                    "animate-icon-enter",
                    "border border-transparent hover:border-blue-200/40 dark:hover:border-blue-800/40",
                    "relative z-20"
                  )}
                  onClick={() => {
                    setDialogOpen(true);
                  }}
                  aria-label="Show instructions"
                  title="Show instructions"
                  style={{ animationDelay: '0.15s' }}
                  suppressHydrationWarning
                >
                  <Info className={cn(
                    "w-6 h-6 sm:w-5 sm:h-5 text-blue-600 dark:text-blue-400",
                    "transition-all duration-200",
                    "group-hover:scale-110 group-hover:text-blue-700 dark:group-hover:text-blue-300"
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
                    "supports-[backdrop-filter]:bg-white/90 supports-[backdrop-filter]:dark:bg-gray-950/90",
                    "[&::-webkit-scrollbar]:w-2",
                    "[&::-webkit-scrollbar-track]:bg-transparent",
                    "[&::-webkit-scrollbar-thumb]:bg-gray-300 dark:[&::-webkit-scrollbar-thumb]:bg-gray-700",
                    "[&::-webkit-scrollbar-thumb]:rounded-full",
                    "[&::-webkit-scrollbar-thumb]:hover:bg-gray-400 dark:[&::-webkit-scrollbar-thumb]:hover:bg-gray-600"
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
                          "tracking-[-0.02em]",
                          "leading-tight",
                          "flex items-baseline"
                        )}>
                          {isHome ? (
                            <>
                              <span className="whitespace-pre">How to Use </span><span className="text-gray-900 dark:text-white">Comp</span><span className="text-purple-600 dark:text-purple-200">Lens</span><sup className="text-xs font-normal text-gray-900 dark:text-white opacity-90 ml-0.5">™</sup>
                            </>
                          ) : (
                            screenGuide.title
                          )}
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
                                  Main Tools
                                </h4>
                                <ul className="space-y-3 text-gray-700 dark:text-gray-300">
                                  <li>
                                    <strong className="text-gray-900 dark:text-white">CF Modelling:</strong> Model conversion factors and productivity levels. Enter market data, select a CF model, and see how wRVU percentiles align with TCC percentiles.
                                  </li>
                                  <li>
                                    <strong className="text-gray-900 dark:text-white">FMV Calculator:</strong> Perform fast FMV reasonableness checks and percentile analysis across TCC, wRVU, and Conversion Factor metrics.
                                  </li>
                                  <li>
                                    <strong className="text-gray-900 dark:text-white">Provider Comparison:</strong> Quickly compare providers side-by-side with different pay, CF models, and productivity levels to see how they calculate incentives and total cash compensation.
                                  </li>
                                  <li>
                                    <strong className="text-gray-900 dark:text-white">Call Pay Modeler:</strong> Model call-pay structures with per-call, per-shift, or tiered payment methods and see annualized outputs.
                                  </li>
                                  <li>
                                    <strong className="text-gray-900 dark:text-white">wRVU Forecaster:</strong> Forecast annual wRVUs and compensation based on your schedule and patient load.
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

                              <div>
                                <h4 className={cn(
                                  "font-semibold text-gray-900 dark:text-white mb-3",
                                  "text-base sm:text-lg"
                                )}>
                                  Market Data Management
                                </h4>
                                <p className="text-gray-700 dark:text-gray-300">
                                  Upload and manage market benchmark data (TCC, wRVU, CF) by specialty. Access it via the &quot;Upload&quot; links in FMV calculators, or navigate to <Link href="/market-data" className="text-primary hover:underline font-medium">Market Data Management</Link> to bulk import from CSV/Excel files.
                                </p>
                              </div>
                            </>
                          ) : (
                            // Other screens: Show screen-specific information
                            <div className="space-y-4">
                              {parseDescription(screenGuide.description)}
                            </div>
                          )}

                        </div>

                        <div className="flex justify-end mt-8">
                          <Dialog.Close asChild>
                            <Button 
                              variant="outline" 
                              className="transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
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

            {/* Theme toggle - subtle but accessible */}
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={toggleTheme}
              className={cn(
                "min-w-[44px] h-[44px]",
                "rounded-xl",
                "hover:bg-gray-100/90 dark:hover:bg-gray-800/90",
                "active:bg-gray-200/90 dark:active:bg-gray-700/90",
                "transition-all duration-200 ease-out",
                "active:scale-[0.92] touch-manipulation",
                "hover:shadow-sm hover:shadow-gray-200/30 dark:hover:shadow-gray-900/30",
                "active:shadow-xs",
                "group",
                "animate-icon-enter",
                "border border-transparent hover:border-gray-200/30 dark:hover:border-gray-700/30",
                "relative z-20"
              )}
              aria-label="Toggle theme"
              title="Toggle dark/light mode"
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

