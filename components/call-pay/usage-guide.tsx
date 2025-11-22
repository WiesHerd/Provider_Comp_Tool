'use client';

import { useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { Button } from '@/components/ui/button';
import { Info } from 'lucide-react';

export function UsageGuide() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Dialog.Root open={isOpen} onOpenChange={setIsOpen}>
      <Dialog.Trigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          aria-label="How to use this tool"
        >
          <Info className="h-5 w-5" />
        </Button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 z-50" />
        <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white dark:bg-gray-900 rounded-2xl p-6 max-w-2xl w-[90vw] max-h-[90vh] overflow-y-auto z-50 shadow-xl">
          <Dialog.Title className="text-xl font-bold mb-4">How to Use This Tool</Dialog.Title>
          <div className="space-y-4 text-sm">
            <div>
              <h4 className="font-semibold mb-1 text-gray-900 dark:text-gray-100">Step 1: Set Context</h4>
              <p className="text-gray-700 dark:text-gray-300">
                Enter your specialty, number of providers, and rotation ratio (e.g., 1-in-4 means each provider covers 1/4 of calls).
              </p>
            </div>
            
            <div>
              <h4 className="font-semibold mb-1 text-gray-900 dark:text-gray-100">Step 2: Configure Tiers</h4>
              <p className="text-gray-700 dark:text-gray-300">
                For each tier (C1-C5), enable it and enter:
              </p>
              <ul className="list-disc list-inside ml-2 mt-1 space-y-1 text-gray-700 dark:text-gray-300">
                <li><strong>Coverage Type:</strong> In-house, home call, etc.</li>
                <li><strong>Payment Method:</strong> Daily rate, stipend, etc.</li>
                <li><strong>Rates:</strong> Weekday, weekend, holiday rates</li>
                <li><strong>Burden Assumptions:</strong> Total calls/shifts needed per month for your service</li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-1 text-gray-900 dark:text-gray-100">Step 3: Review Annual Budget</h4>
              <p className="text-gray-700 dark:text-gray-300">
                The <strong>&quot;Total Annual Call Budget&quot;</strong> at the bottom shows your annual budget. This is calculated automatically as you enter values.
              </p>
            </div>

            <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg border border-blue-200 dark:border-blue-800">
              <p className="font-semibold text-blue-900 dark:text-blue-100 mb-1">
                💡 Key Point:
              </p>
              <p className="text-blue-800 dark:text-blue-200">
                <strong>&quot;Burden Assumptions&quot;</strong> = Total calls/shifts your service needs per month, NOT per provider. The rotation ratio automatically distributes this among providers.
              </p>
            </div>

            <div>
              <h4 className="font-semibold mb-1 text-gray-900 dark:text-gray-100">Example:</h4>
              <p className="text-gray-700 dark:text-gray-300">
                If your cardiology service needs 15 weekday calls/month covered:
              </p>
              <ul className="list-disc list-inside ml-2 mt-1 space-y-1 text-gray-700 dark:text-gray-300">
                <li>Enter <strong>15</strong> in &quot;Weekday Calls/Shifts per Month&quot;</li>
                <li>With 1-in-4 rotation, each provider covers 15÷4 = 3.75 calls/month</li>
                <li>The tool calculates annual pay per provider automatically</li>
                <li>Multiply by number of providers = Your annual budget</li>
              </ul>
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

