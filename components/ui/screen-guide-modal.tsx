'use client';

import { useState, useEffect } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { Button } from '@/components/ui/button';
import { X, Sparkles } from 'lucide-react';

interface ScreenGuideModalProps {
  title: string;
  description: string;
  storageKey: string; // Unique key for localStorage to track if user has seen this
  autoShow?: boolean; // Whether to auto-show on first visit
  delay?: number; // Delay before showing (ms)
}

export function ScreenGuideModal({ 
  title, 
  description, 
  storageKey,
  autoShow = true,
  delay = 500 
}: ScreenGuideModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [hasSeen, setHasSeen] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    // Check if user has seen this guide
    const seen = localStorage.getItem(storageKey);
    if (seen === 'true') {
      setHasSeen(true);
    }

    // Auto-show if enabled and not seen
    if (autoShow && !seen) {
      const timer = setTimeout(() => {
        setIsOpen(true);
      }, delay);
      return () => clearTimeout(timer);
    }

    // Listen for custom event to open modal on demand
    const handleOpenModal = () => {
      setIsOpen(true);
    };

    // Create event name from storage key
    const eventName = `${storageKey}-open`;
    window.addEventListener(eventName, handleOpenModal);
    
    return () => {
      window.removeEventListener(eventName, handleOpenModal);
    };
  }, [storageKey, autoShow, delay]);

  const handleClose = () => {
    setIsOpen(false);
    if (typeof window !== 'undefined') {
      localStorage.setItem(storageKey, 'true');
      setHasSeen(true);
    }
  };

  // Always render so it can be opened on demand

  return (
    <Dialog.Root open={isOpen} onOpenChange={(open) => {
      if (!open) {
        handleClose();
      } else {
        setIsOpen(open);
      }
    }}>
      <Dialog.Portal>
        <Dialog.Overlay 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] animate-in fade-in"
          onClick={handleClose}
        />
        <Dialog.Content 
          className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white dark:bg-gray-900 rounded-3xl p-6 md:p-8 max-w-lg w-[calc(100vw-2rem)] max-h-[min(calc(100vh-6rem),600px)] md:max-h-[85vh] overflow-y-auto z-[101] shadow-2xl animate-in fade-in zoom-in-95 duration-300"
          onPointerDownOutside={(e) => {
            e.preventDefault();
            handleClose();
          }}
          onEscapeKeyDown={handleClose}
        >
          {/* Header */}
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-center gap-3 flex-1">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Sparkles className="w-6 h-6 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <Dialog.Title className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white">
                  {title}
                </Dialog.Title>
              </div>
            </div>
            <Dialog.Close asChild>
              <Button
                variant="ghost"
                className="h-8 w-8 p-0 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 flex-shrink-0"
                onClick={handleClose}
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </Button>
            </Dialog.Close>
          </div>

          {/* Content */}
          <div className="space-y-4 mb-6">
            <p className="text-sm md:text-base text-gray-600 dark:text-gray-300 whitespace-pre-line leading-relaxed">
              {description}
            </p>
          </div>

          {/* Close Button */}
          <div className="flex justify-end">
            <Button onClick={handleClose}>
              Got it
            </Button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

