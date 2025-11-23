'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Home, Calculator, TrendingUp, Phone, FolderOpen, BarChart3 } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils/cn';
import Link from 'next/link';

const tabs = [
  { id: 'home', label: 'Home', icon: Home, path: '/' },
  { id: 'wrvu-modeler', label: 'wRVU', icon: Calculator, path: '/wrvu-modeler' },
  { id: 'wrvu-forecaster', label: 'Forecaster', icon: BarChart3, path: '/wrvu-forecaster' },
  { id: 'fmv-calculator', label: 'FMV', icon: TrendingUp, path: '/fmv-calculator' },
  { id: 'call-pay-modeler', label: 'Call Pay', icon: Phone, path: '/call-pay-modeler' },
  { id: 'scenarios', label: 'Scenarios', icon: FolderOpen, path: '/scenarios' },
];

export function MainTabs({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Safe pathname check for SSR - ensure consistent initial render
  const activeTab = mounted && pathname 
    ? (tabs.find(tab => {
        // Special handling for home - exact match only
        if (tab.path === '/') {
          return pathname === '/';
        }
        return pathname.startsWith(tab.path);
      })?.id || 'home')
    : (pathname ? (tabs.find(tab => {
        if (tab.path === '/') {
          return pathname === '/';
        }
        return pathname.startsWith(tab.path);
      })?.id || 'home') : 'home');

  return (
    <div className="w-full">
      {/* Desktop Top Tabs - Hidden per user request */}
      {/* <div className="hidden md:block bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 sticky top-[64px] md:top-[72px] z-30">
        <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8">
          <div className="flex gap-1">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <Link
                  key={tab.id}
                  href={tab.path}
                  className={cn(
                    "group relative px-5 md:px-6 py-4 md:py-5 text-sm font-semibold transition-all outline-none rounded-xl",
                    "min-h-[48px] flex items-center gap-2",
                    isActive
                      ? "bg-gray-100 dark:bg-gray-800 text-primary"
                      : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-800/50"
                  )}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                  {isActive && mounted && (
                    <motion.div
                      className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-t-full"
                      layoutId="activeTab"
                      initial={false}
                      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                    />
                  )}
                </Link>
              );
            })}
          </div>
        </div>
      </div> */}

      <div className="pt-[64px] sm:pt-[72px] pb-20 md:pb-0 bg-gray-50 dark:bg-gray-900">
        {children}
      </div>

      {/* Mobile Bottom Tabs */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 shadow-[0_-2px_10px_rgba(0,0,0,0.05)] dark:shadow-[0_-2px_10px_rgba(0,0,0,0.3)] safe-area-inset-bottom">
        <div className="flex items-center justify-around h-16 px-2">
          {tabs.filter(tab => tab.id !== 'scenarios').map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <Link
                key={tab.id}
                href={tab.path}
                className={cn(
                  "flex-1 flex flex-col items-center justify-center gap-1 py-2 text-[10px] sm:text-xs font-semibold transition-all outline-none",
                  "min-w-0 min-h-[44px] relative",
                  isActive
                    ? "text-primary"
                    : "text-gray-600 dark:text-gray-400"
                )}
              >
                <div className="relative w-full flex justify-center">
                  <motion.div
                    className="relative inline-flex items-center justify-center"
                    animate={isActive ? { scale: 1.1 } : { scale: 1 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 17 }}
                  >
                    <Icon className="w-7 h-7 flex-shrink-0" />
                    {isActive && mounted && (
                      <motion.div
                        className="absolute -top-1 left-1/2 -translate-x-1/2 w-7 h-1 bg-primary rounded-b-full"
                        layoutId="mobileActiveTab"
                        initial={false}
                        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                      />
                    )}
                  </motion.div>
                </div>
                <span className="truncate w-full text-center">
                  {isActive && mounted ? (
                    <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }}>{tab.label}</motion.span>
                  ) : (
                    <span className={isActive ? 'opacity-100' : 'opacity-0'}>{tab.label}</span>
                  )}
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}

