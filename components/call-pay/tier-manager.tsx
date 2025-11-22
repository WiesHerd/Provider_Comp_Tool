'use client';

import { CallTier } from '@/types/call-pay';
import { Plus, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

interface TierManagerProps {
  tiers: CallTier[];
  onTiersChange: (tiers: CallTier[]) => void;
  onCreateTier: () => CallTier;
}

export function TierManager({ tiers, onTiersChange, onCreateTier }: TierManagerProps) {
  const addTier = () => {
    const nextNumber = tiers.length + 1;
    const newTier = onCreateTier();
    newTier.id = `C${nextNumber}`;
    newTier.name = `C${nextNumber}`;
    onTiersChange([...tiers, newTier]);
  };

  const removeTier = (tierId: string) => {
    if (tiers.length <= 1) {
      // Don't allow removing the last tier
      return;
    }
    onTiersChange(tiers.filter((t) => t.id !== tierId));
  };

  return (
    <div className="flex items-center gap-4">
      {/* Tier count with better spacing */}
      <span className="text-sm font-medium text-gray-500 dark:text-gray-400 tracking-tight">
        {tiers.length} tier{tiers.length !== 1 ? 's' : ''} configured
      </span>
      
      {/* Apple-like button group */}
      <div className="flex items-center gap-2">
        {tiers.length < 10 && (
          <button
            onClick={addTier}
            className={cn(
              "inline-flex items-center justify-center gap-1.5",
              "px-3.5 py-2.5 rounded-lg",
              "text-sm font-medium",
              "bg-white dark:bg-gray-800",
              "border border-gray-200 dark:border-gray-700",
              "text-gray-700 dark:text-gray-300",
              "hover:bg-gray-50 dark:hover:bg-gray-700",
              "active:bg-gray-100 dark:active:bg-gray-600",
              "transition-all duration-150",
              "shadow-sm hover:shadow",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1",
              "min-h-[44px] touch-manipulation" // iOS-friendly touch target
            )}
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Tier</span>
          </button>
        )}
        {tiers.length > 1 && (
          <button
            onClick={() => removeTier(tiers[tiers.length - 1].id)}
            className={cn(
              "inline-flex items-center justify-center gap-1.5",
              "px-3.5 py-2.5 rounded-lg",
              "text-sm font-medium",
              "bg-white dark:bg-gray-800",
              "border border-red-200 dark:border-red-800/50",
              "text-red-600 dark:text-red-400",
              "hover:bg-red-50 dark:hover:bg-red-900/20",
              "active:bg-red-100 dark:active:bg-red-900/30",
              "transition-all duration-150",
              "shadow-sm hover:shadow",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-1",
              "min-h-[44px] touch-manipulation" // iOS-friendly touch target
            )}
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Remove Last</span>
          </button>
        )}
      </div>
    </div>
  );
}

