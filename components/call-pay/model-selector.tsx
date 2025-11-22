'use client';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils/cn';

export type CallPayModel = 'per-call' | 'per-shift' | 'tiered';

interface ModelSelectorProps {
  selectedModel: CallPayModel;
  onModelChange: (model: CallPayModel) => void;
}

export function ModelSelector({ selectedModel, onModelChange }: ModelSelectorProps) {
  const models: { id: CallPayModel; label: string }[] = [
    { id: 'per-call', label: 'Per-Call Stipend' },
    { id: 'per-shift', label: 'Per-Shift' },
    { id: 'tiered', label: 'Tiered' },
  ];

  return (
    <div className="flex gap-2 p-1 bg-gray-100 dark:bg-gray-800 rounded-xl">
      {models.map((model) => (
        <button
          key={model.id}
          onClick={() => onModelChange(model.id)}
          className={cn(
            "flex-1 px-4 py-2 rounded-lg font-semibold text-sm transition-all",
            "min-h-[44px]",
            selectedModel === model.id
              ? "bg-white dark:bg-gray-900 text-primary shadow-sm"
              : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
          )}
        >
          {model.label}
        </button>
      ))}
    </div>
  );
}

