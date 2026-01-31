'use client';

import { useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { Button } from '@/components/ui/button';
import { Info } from 'lucide-react';

export function CallTierInfo() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Dialog.Root open={isOpen} onOpenChange={setIsOpen}>
      <Dialog.Trigger asChild>
        <Button
          variant="ghost"
          className="h-8 w-8 p-0 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          aria-label="Understanding call tiers"
        >
          <Info className="h-5 w-5" />
        </Button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 z-50" />
        <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white dark:bg-gray-900 rounded-2xl p-6 max-w-lg w-[90vw] max-h-[90vh] overflow-y-auto z-50 shadow-xl">
          <Dialog.Title className="text-xl font-bold mb-4">Understanding Call Tiers (C1, C2, C3, etc.)</Dialog.Title>
          <div className="space-y-4 text-sm">
            <div>
              <h4 className="font-semibold mb-2 text-gray-900 dark:text-gray-100">C1 (First Call)</h4>
              <p className="text-gray-700 dark:text-gray-300">
                Primary on-call coverage with the highest frequency and immediate response requirements. The first-call physician is the primary responder and typically handles the majority of call volume.
              </p>
            </div>
            
            <div>
              <h4 className="font-semibold mb-2 text-gray-900 dark:text-gray-100">C2 (Second Call)</h4>
              <p className="text-gray-700 dark:text-gray-300">
                Backup coverage that activates when C1 is unavailable or needs support. Less frequent activation than C1, often used for overflow or specialized cases.
              </p>
            </div>

            <div>
              <h4 className="font-semibold mb-2 text-gray-900 dark:text-gray-100">C3 (Third Call)</h4>
              <p className="text-gray-700 dark:text-gray-300">
                Tertiary coverage for specialized situations or when both C1 and C2 are engaged. Typically the least frequent activation level.
              </p>
            </div>

            <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg border border-blue-200 dark:border-blue-800">
              <p className="text-xs text-gray-600 dark:text-gray-400 italic">
                Note: Specific definitions may vary by institution. C4, C5, and additional tiers can be used for further stratification as needed.
              </p>
            </div>
          </div>
          <div className="flex justify-end mt-6">
            <Dialog.Close asChild>
              <Button variant="outline">Close</Button>
            </Dialog.Close>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}































