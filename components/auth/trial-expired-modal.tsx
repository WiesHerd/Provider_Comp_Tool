'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Zap, Mail, X } from 'lucide-react';
import * as Dialog from '@radix-ui/react-dialog';
import { getDaysSinceTrialExpired } from '@/lib/utils/trial-status';
import { UserProfile } from '@/lib/firebase/user-profile';
import { cn } from '@/lib/utils/cn';

interface TrialExpiredModalProps {
  userProfile: UserProfile | null;
  open: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function TrialExpiredModal({ userProfile, open, onOpenChange }: TrialExpiredModalProps) {
  const router = useRouter();
  const daysExpired = userProfile ? getDaysSinceTrialExpired(userProfile) : 0;

  // Professional soft-gate: modal is dismissible (no hostage UX).
  const handleOpenChange = (newOpen: boolean) => {
    onOpenChange?.(newOpen);
  };

  const handleUpgrade = () => {
    // Close the modal before navigating so it doesn't block the Pricing page UI.
    onOpenChange?.(false);
    router.push('/pricing');
  };

  const handleContactSales = () => {
    window.location.href = 'mailto:sales@complens.com?subject=Enterprise Inquiry';
  };

  return (
    <Dialog.Root open={open} onOpenChange={handleOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay 
          className={cn(
            "fixed inset-0 z-[200]",
            "bg-black/70 dark:bg-black/80",
            "backdrop-blur-md",
            "animate-in fade-in duration-300"
          )} 
        />
        <Dialog.Content 
          className={cn(
            "fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2",
            "bg-white dark:bg-gray-950",
            "rounded-2xl p-6 sm:p-8 md:p-10",
            "max-w-lg w-[90vw]",
            "z-[201]",
            "shadow-2xl shadow-gray-900/20 dark:shadow-gray-900/50",
            "border border-gray-200 dark:border-gray-800",
            "animate-in fade-in zoom-in-95 duration-300"
          )}
        >
          <div className="space-y-6">
            {/* Header */}
            <div className="text-center">
              <div className="flex justify-end">
                <Dialog.Close asChild>
                  <button
                    type="button"
                    className="rounded-full p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 dark:text-gray-400 dark:hover:text-gray-200 transition"
                    aria-label="Close"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </Dialog.Close>
              </div>
              <div className="mx-auto w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mb-4">
                <X className="w-8 h-8 text-red-600 dark:text-red-400" />
              </div>
              <Dialog.Title className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-2">
                Your Trial Has Ended
              </Dialog.Title>
              <p className="text-gray-600 dark:text-gray-400">
                {daysExpired > 0 
                  ? `Your free trial ended ${daysExpired} ${daysExpired === 1 ? 'day' : 'days'} ago.`
                  : 'Your free trial has ended.'}
              </p>
            </div>

            {/* Content */}
            <div className="space-y-4">
              <p className="text-gray-700 dark:text-gray-300 text-center">
                To continue using CompLens, please upgrade to a paid plan. Choose the plan that best fits your needs.
              </p>

              <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg border border-purple-200 dark:border-purple-800">
                <h3 className="font-semibold text-purple-900 dark:text-purple-100 mb-2 flex items-center gap-2">
                  <Zap className="w-5 h-5" />
                  Pro Plan Benefits
                </h3>
                <ul className="text-sm text-purple-800 dark:text-purple-200 space-y-1 list-disc list-inside">
                  <li>Unlimited scenarios</li>
                  <li>Advanced CF modeling</li>
                  <li>Bulk contract generation</li>
                  <li>Priority support</li>
                  <li>Export to PDF/DOCX</li>
                </ul>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                onClick={handleUpgrade}
                className="flex-1 bg-purple-600 hover:bg-purple-700 text-white"
                size="lg"
              >
                <Zap className="w-4 h-4 mr-2" />
                Upgrade to Pro
              </Button>
              <Button
                onClick={handleContactSales}
                variant="outline"
                className="flex-1"
                size="lg"
              >
                <Mail className="w-4 h-4 mr-2" />
                Contact Sales
              </Button>
            </div>

            <div className="text-center">
              <Dialog.Close asChild>
                <Button variant="ghost" className="text-gray-600 dark:text-gray-400">
                  Not now
                </Button>
              </Dialog.Close>
            </div>

            <p className="text-xs text-center text-gray-500 dark:text-gray-400">
              You can keep browsing, and you’ll be prompted again when you try a locked tool.
            </p>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
