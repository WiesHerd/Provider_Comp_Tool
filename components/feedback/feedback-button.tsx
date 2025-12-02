'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { FeedbackModal } from './feedback-modal';
import { MessageCircle } from 'lucide-react';

export function FeedbackButton() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <Button
        onClick={() => setIsOpen(true)}
        variant="outline"
        className="fixed bottom-24 right-6 sm:bottom-6 z-50 h-12 w-12 sm:h-auto sm:w-auto sm:px-4 rounded-full shadow-lg hover:shadow-xl bg-white dark:bg-gray-900 border-2 border-gray-200 dark:border-gray-700 hover:border-primary transition-all duration-200 group"
        aria-label="Send feedback"
      >
        <MessageCircle className="w-5 h-5 sm:mr-2 text-gray-600 dark:text-gray-400 group-hover:text-primary transition-colors" />
        <span className="hidden sm:inline text-sm font-semibold text-gray-700 dark:text-gray-300 group-hover:text-primary transition-colors">
          Feedback
        </span>
      </Button>
      <FeedbackModal isOpen={isOpen} onOpenChange={setIsOpen} />
    </>
  );
}

