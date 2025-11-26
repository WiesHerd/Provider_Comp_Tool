'use client';

import * as React from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { Button } from './button';

interface PopoverProps {
  children: React.ReactNode;
  content: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  side?: 'top' | 'bottom' | 'left' | 'right';
  className?: string;
}

export function Popover({ 
  children, 
  content, 
  open: controlledOpen,
  onOpenChange,
  side = 'bottom',
  className 
}: PopoverProps) {
  const [internalOpen, setInternalOpen] = React.useState(false);
  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : internalOpen;
  const setOpen = isControlled ? onOpenChange || (() => {}) : setInternalOpen;

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger asChild>
        {children}
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 z-50" />
        <Dialog.Content
          className={cn(
            'fixed z-50 w-[90vw] max-w-sm bg-white dark:bg-gray-900 rounded-2xl shadow-xl p-4',
            'animate-in fade-in-0 zoom-in-95 duration-200',
            side === 'top' && 'top-4 left-1/2 -translate-x-1/2',
            side === 'bottom' && 'bottom-4 left-1/2 -translate-x-1/2',
            side === 'left' && 'left-4 top-1/2 -translate-y-1/2',
            side === 'right' && 'right-4 top-1/2 -translate-y-1/2',
            className
          )}
        >
          <Dialog.Title className="sr-only">Information</Dialog.Title>
          <Dialog.Close asChild>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 absolute top-2 right-2"
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </Button>
          </Dialog.Close>
          <Dialog.Description className="text-sm text-gray-700 dark:text-gray-300 pr-6">
            {content}
          </Dialog.Description>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

