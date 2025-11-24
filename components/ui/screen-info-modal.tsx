'use client';

import { useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { Button } from '@/components/ui/button';
import { Info, X } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

interface ScreenInfoModalProps {
  title: string;
  description: string;
  note?: string;
}

// Parse description text into formatted React elements
function parseDescription(description: string): React.ReactNode[] {
  // Ensure description is a string
  if (!description || typeof description !== 'string') {
    return [];
  }
  
  // Normalize the description - handle both actual newlines and escaped \n
  // Replace literal \n strings with actual newlines if they exist
  const normalizedDescription = description.replace(/\\n/g, '\n');
  const lines = normalizedDescription.split(/\r?\n/);
  const elements: React.ReactNode[] = [];
  let currentSection: React.ReactNode[] = [];
  let currentList: React.ReactNode[] = [];
  let inList = false;
  let inSection = false;

  const flushList = () => {
    if (currentList.length > 0) {
      const listElement = (
        <ul key={`list-${currentSection.length}`} className="list-disc list-outside space-y-2 ml-5 pl-1 text-gray-700 dark:text-gray-300">
          {currentList}
        </ul>
      );
      currentSection.push(listElement);
      currentList = [];
      inList = false;
    }
  };

  const flushSection = () => {
    if (currentSection.length > 0) {
      elements.push(
        <div key={`section-${elements.length}`} className="space-y-4">
          {currentSection}
        </div>
      );
      currentSection = [];
      inSection = false;
    }
  };

  lines.forEach((line, index) => {
    const trimmedLine = line.trim();
    
    // Skip empty lines
    if (trimmedLine === '') {
      if (inList) {
        flushList();
      }
      return;
    }

    // Handle main headers (## Header) - start a new section div
    if (trimmedLine.startsWith('## ')) {
      flushList();
      flushSection();
      const headerText = trimmedLine.substring(3).trim();
      currentSection.push(
        <h3
          key={`header-${index}`}
          className={cn(
            "font-semibold text-gray-900 dark:text-white mb-4 mt-6 first:mt-0",
            "text-lg sm:text-xl"
          )}
        >
          {headerText}
        </h3>
      );
      inSection = true;
      return;
    }

    // Handle subheaders (### Subheader)
    if (trimmedLine.startsWith('### ')) {
      flushList();
      const subheaderText = trimmedLine.substring(4).trim();
      currentSection.push(
        <h4
          key={`subheader-${index}`}
          className={cn(
            "font-semibold text-gray-900 dark:text-white mb-3 mt-5 first:mt-0",
            "text-base sm:text-lg"
          )}
        >
          {subheaderText}
        </h4>
      );
      if (!inSection) {
        inSection = true;
      }
      return;
    }

    // Handle bullet points - match Unicode bullet (•), dash (-), or asterisk (*)
    // Support both at start of line and with 2+ spaces of indentation
    const bulletMatch = trimmedLine.match(/^[\u2022\-\*]|^\s{2,}[\u2022\-\*]/);
    if (bulletMatch) {
      // If we're not in a list, start one
      if (!inList) {
        inList = true;
      }
      // Remove bullet character and any leading whitespace, then trim
      const content = trimmedLine.replace(/^[\u2022\-\*]\s*|^\s{2,}[\u2022\-\*]\s*/, '').trim();
      const processedContent = processBoldText(content);
      currentList.push(
        <li key={`bullet-${index}`} className="leading-relaxed">
          {processedContent}
        </li>
      );
      if (!inSection) {
        inSection = true;
      }
      return;
    }

    // If we hit a non-list item while in a list, flush it
    if (inList) {
      flushList();
    }

    // Handle regular paragraphs
    const processedContent = processBoldText(trimmedLine);
    currentSection.push(
      <p key={`para-${index}`} className="text-gray-700 dark:text-gray-300 mb-3 leading-relaxed last:mb-0">
        {processedContent}
      </p>
    );
    if (!inSection) {
      inSection = true;
    }
  });

  // Flush any remaining lists and sections
  flushList();
  flushSection();

  return elements;
}

// Process bold text markers (**text** or **text**:)
function processBoldText(text: string): React.ReactNode[] {
  const parts: React.ReactNode[] = [];
  const boldRegex = /\*\*([^*]+)\*\*/g;
  let lastIndex = 0;
  let match;

  while ((match = boldRegex.exec(text)) !== null) {
    // Add text before the bold
    if (match.index > lastIndex) {
      parts.push(text.substring(lastIndex, match.index));
    }
    // Add bold text
    parts.push(
      <strong key={`bold-${match.index}`} className="text-gray-900 dark:text-white">
        {match[1]}
      </strong>
    );
    lastIndex = match.index + match[0].length;
  }

  // Add remaining text
  if (lastIndex < text.length) {
    parts.push(text.substring(lastIndex));
  }

  return parts.length > 0 ? parts : [text];
}

export function ScreenInfoModal({ title, description, note }: ScreenInfoModalProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Dialog.Root open={isOpen} onOpenChange={setIsOpen}>
      <Dialog.Trigger asChild>
        <button
          type="button"
          className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 cursor-help transition-colors"
          aria-label="Screen information"
        >
          <Info className="w-5 h-5" />
        </button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] animate-in fade-in" />
        <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white dark:bg-gray-900 rounded-3xl p-4 sm:p-6 md:p-8 max-w-2xl w-[calc(100vw-2rem)] max-h-[calc(100vh-8rem)] md:max-h-[85vh] overflow-y-auto z-[101] shadow-2xl animate-in fade-in zoom-in-95 duration-300">
          {/* Header */}
          <div className="flex items-start justify-between mb-6">
            <Dialog.Title className="text-2xl font-bold text-gray-900 dark:text-white">
              {title}
            </Dialog.Title>
            <Dialog.Close asChild>
              <Button
                variant="ghost"
                className="h-8 w-8 p-0 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <X className="h-4 w-4" />
              </Button>
            </Dialog.Close>
          </div>

          {/* Content */}
          <div className="space-y-6 mb-6">
            {description ? parseDescription(description) : null}
          </div>

          {/* Note */}
          {note && (
            <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6">
              <p className="text-base text-blue-900 dark:text-blue-200 leading-relaxed">
                {note}
              </p>
            </div>
          )}

          {/* Close Button */}
          <div className="flex justify-end">
            <Dialog.Close asChild>
              <Button className="min-w-[120px]">
                Close
              </Button>
            </Dialog.Close>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

