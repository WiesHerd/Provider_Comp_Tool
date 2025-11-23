'use client';

import { useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { Button } from '@/components/ui/button';
import { Info, X } from 'lucide-react';

interface ScreenInfoModalProps {
  title: string;
  description: string;
  note?: string;
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
        <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white dark:bg-gray-900 rounded-3xl p-6 md:p-8 max-w-lg w-[90vw] max-h-[85vh] overflow-y-auto z-[101] shadow-2xl animate-in fade-in zoom-in-95 duration-300">
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
          <div className="space-y-5 mb-6">
            <div className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
              {description.split('\n').map((line, index, array) => {
                const trimmedLine = line.trim();
                
                // Skip empty lines but add spacing
                if (trimmedLine === '') {
                  return <div key={index} className="h-2" />;
                }
                
                // Handle main headers (## Header)
                if (trimmedLine.startsWith('## ')) {
                  return (
                    <h3 key={index} className="text-lg font-bold text-gray-900 dark:text-white mt-6 mb-3 first:mt-0">
                      {trimmedLine.substring(3).trim()}
                    </h3>
                  );
                }
                
                // Handle subheaders (### Subheader)
                if (trimmedLine.startsWith('### ')) {
                  return (
                    <h4 key={index} className="text-base font-semibold text-gray-900 dark:text-white mt-4 mb-2">
                      {trimmedLine.substring(4).trim()}
                    </h4>
                  );
                }
                
                // Handle nested bullet points (  - or  •)
                if (trimmedLine.match(/^\s{2,}[•-]/)) {
                  const content = trimmedLine.replace(/^\s{2,}[•-]\s*/, '');
                  return (
                    <div key={index} className="ml-8 mb-1.5 flex items-start">
                      <span className="mr-2 flex-shrink-0 text-gray-500 dark:text-gray-400">◦</span>
                      <span className="flex-1">{content}</span>
                    </div>
                  );
                }
                
                // Handle main bullet points (•)
                if (trimmedLine.startsWith('•')) {
                  return (
                    <div key={index} className="ml-4 mb-2 flex items-start">
                      <span className="mr-2 flex-shrink-0 text-gray-900 dark:text-gray-100 font-semibold">•</span>
                      <span className="flex-1">{trimmedLine.substring(1).trim()}</span>
                    </div>
                  );
                }
                
                // Handle section headers (lines that end with colon and are bold-like)
                if (trimmedLine.endsWith(':') && trimmedLine.length < 50) {
                  return (
                    <h4 key={index} className="text-base font-semibold text-gray-900 dark:text-white mb-2 mt-4 first:mt-0">
                      {trimmedLine}
                    </h4>
                  );
                }
                
                // Handle regular paragraphs
                return (
                  <p key={index} className="mb-3 last:mb-0">
                    {trimmedLine}
                  </p>
                );
              })}
            </div>
          </div>

          {/* Note */}
          {note && (
            <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6">
              <p className="text-sm text-blue-900 dark:text-blue-200">
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

