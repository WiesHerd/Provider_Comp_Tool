'use client';

/**
 * BackButton Component
 * 
 * IMPORTANT USAGE GUIDELINES (Apple HIG Compliance):
 * 
 * 1. **DO NOT use this component in content areas for page-level navigation.**
 *    - The header already provides a back button in the top-left corner (Apple HIG standard)
 *    - Using this component in content creates duplicate navigation and confuses users
 * 
 * 2. **Primary Navigation:**
 *    - Page-level back navigation is handled by the header back button (components/layout/header.tsx)
 *    - The header back button appears automatically when pathname !== '/'
 *    - This follows Apple Human Interface Guidelines: back buttons belong in top-left navigation bar
 * 
 * 3. **When to use this component:**
 *    - Only for specific, non-standard navigation needs
 *    - Custom navigation flows that require programmatic control
 *    - NOT for step navigation within forms (use ProgressiveFormNavigation instead)
 *    - NOT for duplicating header functionality
 * 
 * 4. **For step navigation within forms:**
 *    - Use ProgressiveFormNavigation component (components/ui/progressive-form.tsx)
 *    - Or use styled "Previous" buttons with clear labels (e.g., "← Previous", "← Edit Market Data")
 *    - These should be clearly step navigation, not page navigation
 * 
 * 5. **Apple HIG Requirements:**
 *    - Back buttons must be in top-left corner (header)
 *    - Bottom area is reserved for tab bars/toolbars, NOT navigation buttons
 *    - Minimum 44px touch target (already implemented)
 * 
 * @deprecated For most use cases, use header back button or ProgressiveFormNavigation instead
 */

import { ChevronLeft } from 'lucide-react';
import { Button } from './button';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { cn } from '@/lib/utils/cn';

interface BackButtonProps {
  /** Custom onClick handler. If provided, overrides default navigation */
  onClick?: () => void;
  /** URL to navigate to. If provided, uses Link instead of router.back() */
  href?: string;
  /** Label for accessibility */
  'aria-label'?: string;
  /** Additional className */
  className?: string;
  /** Variant style - 'ghost' matches header, 'outline' for more visible buttons */
  variant?: 'ghost' | 'outline';
  /** Size - 'sm' matches header style */
  size?: 'sm' | 'default';
}

export function BackButton({
  onClick,
  href,
  'aria-label': ariaLabel = 'Go back',
  className,
  variant = 'ghost',
  size = 'sm',
}: BackButtonProps) {
  const router = useRouter();

  const handleClick = () => {
    if (onClick) {
      onClick();
    } else if (!href) {
      router.back();
    }
  };

  const buttonClasses = cn(
    'min-w-[44px] h-[44px] rounded-full',
    'hover:bg-gray-100/80 dark:hover:bg-gray-800/80',
    'transition-all duration-300 ease-out',
    'active:scale-[0.96]',
    'hover:shadow-sm',
    className
  );

  const iconClasses = 'w-5 h-5 transition-transform duration-300 group-hover:-translate-x-0.5';

  if (href) {
    return (
      <Link href={href} aria-label={ariaLabel} className="inline-block">
        <Button
          variant={variant}
          size={size}
          className={buttonClasses}
        >
          <ChevronLeft className={iconClasses} />
        </Button>
      </Link>
    );
  }

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleClick}
      className={buttonClasses}
      aria-label={ariaLabel}
    >
      <ChevronLeft className={iconClasses} />
    </Button>
  );
}

