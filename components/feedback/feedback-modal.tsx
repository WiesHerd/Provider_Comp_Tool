'use client';

import { useState, FormEvent } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { X, Mail } from 'lucide-react';
import { usePathname } from 'next/navigation';

interface FeedbackModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

// Your email address - update this to your actual email
const FEEDBACK_EMAIL = 'wherdzik@gmail.com';

export function FeedbackModal({ isOpen, onOpenChange }: FeedbackModalProps) {
  const pathname = usePathname();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (!message.trim()) {
      setErrorMessage('Please enter your feedback message.');
      return;
    }

    setErrorMessage('');

    // Build email subject
    const subject = encodeURIComponent(
      `Feedback from CompLens${name.trim() ? ` - ${name.trim()}` : ''}`
    );

    // Build email body
    const emailBody = encodeURIComponent(`Feedback Submission
Generated: ${new Date().toLocaleString()}

═══════════════════════════════════════════════════════
FEEDBACK DETAILS
═══════════════════════════════════════════════════════

${name.trim() ? `Name: ${name.trim()}` : 'Name: Not provided'}
${email.trim() ? `Email: ${email.trim()}` : 'Email: Not provided'}
Page: ${pathname || '/'}

═══════════════════════════════════════════════════════
MESSAGE
═══════════════════════════════════════════════════════

${message.trim()}
`);

    // Open email client with pre-filled content
    window.location.href = `mailto:${FEEDBACK_EMAIL}?subject=${subject}&body=${emailBody}`;
    
    // Close modal after a brief delay
    setTimeout(() => {
      onOpenChange(false);
      setName('');
      setEmail('');
      setMessage('');
    }, 300);
  };

  const handleClose = () => {
    onOpenChange(false);
    // Reset form after a brief delay to allow close animation
    setTimeout(() => {
      setErrorMessage('');
      setName('');
      setEmail('');
      setMessage('');
    }, 300);
  };

  return (
    <Dialog.Root open={isOpen} onOpenChange={handleClose}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] animate-in fade-in" />
        <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white dark:bg-gray-900 rounded-3xl p-4 sm:p-6 md:p-8 max-w-2xl w-[calc(100vw-2rem)] max-h-[calc(100vh-8rem)] md:max-h-[85vh] overflow-y-auto z-[101] shadow-2xl animate-in fade-in zoom-in-95 duration-300">
          {/* Header */}
          <div className="flex items-start justify-between mb-6">
            <Dialog.Title className="text-2xl font-bold text-gray-900 dark:text-white">
              Send Feedback
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

          {/* Info Message */}
          <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-xl">
            <div className="flex items-start gap-3">
              <Mail className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-blue-900 dark:text-blue-200">
                Your feedback will open in your email client. Just click send to submit.
              </p>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="feedback-name" className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                  Name (Optional)
                </Label>
                <Input
                  id="feedback-name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your name"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="feedback-email" className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                  Email (Optional)
                </Label>
                <Input
                  id="feedback-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your.email@example.com"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  We&apos;ll only use this to follow up if needed
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="feedback-message" className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                  Feedback <span className="text-red-500">*</span>
                </Label>
                <Textarea
                  id="feedback-message"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Tell us what you think... What works well? What could be improved?"
                  rows={6}
                  required
                  className="min-h-[120px] rounded-xl border-gray-300/80 dark:border-gray-600/80 bg-white dark:bg-gray-900 px-4 py-3 text-base focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:ring-offset-1 focus-visible:border-primary transition-all duration-200 shadow-sm focus-visible:shadow-md"
                />
                {errorMessage && (
                  <p className="text-xs text-red-600 dark:text-red-400">{errorMessage}</p>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 sm:justify-end pt-4">
                <Dialog.Close asChild>
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full sm:w-auto"
                  >
                    Cancel
                  </Button>
                </Dialog.Close>
                <Button
                  type="submit"
                  disabled={!message.trim()}
                  className="w-full sm:w-auto min-w-[120px]"
                >
                  <Mail className="w-4 h-4 mr-2" />
                  Open Email
                </Button>
              </div>
            </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

