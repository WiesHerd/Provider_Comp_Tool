'use client';

import { useRouter } from 'next/navigation';

export function Footer() {
  const router = useRouter();

  const handleLinkClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    e.preventDefault();
    router.push(href);
  };

  return (
    <footer className="bg-white dark:bg-gray-950 border-t border-gray-200/80 dark:border-gray-800/50">
      <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 py-8 sm:py-12">
        {/* Simple horizontal link layout */}
        <div className="flex flex-wrap items-center justify-center gap-6 sm:gap-8 mb-8">
          <a
            href="/pricing"
            onClick={(e) => handleLinkClick(e, '/pricing')}
            className="text-[11px] text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors duration-200 cursor-pointer"
          >
            Pricing
          </a>
          <a
            href="mailto:support@complens.com"
            className="text-[11px] text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors duration-200 cursor-pointer"
          >
            Support
          </a>
          <a
            href="mailto:sales@complens.com"
            className="text-[11px] text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors duration-200 cursor-pointer"
          >
            Contact Sales
          </a>
        </div>

        {/* Divider */}
        <div className="border-t border-gray-200/60 dark:border-gray-800/60 mb-6"></div>

        {/* Bottom Section - Copyright and disclaimer */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 sm:gap-6">
          <div>
            <p className="text-[11px] text-gray-500 dark:text-gray-500">
              © {new Date().getFullYear()} CompLens™. All rights reserved.
            </p>
          </div>
          <div className="sm:text-right">
            <p className="text-[10px] text-gray-500 dark:text-gray-500 leading-relaxed max-w-md sm:ml-auto">
              For planning and analysis purposes only. Not a substitute for formal FMV opinions, legal review, or regulatory compliance verification.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}





