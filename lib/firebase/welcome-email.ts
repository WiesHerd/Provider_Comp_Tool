/**
 * Welcome Email Function
 * 
 * Sends a professional welcome email to new users after account creation
 * Uses Resend API for professional email delivery
 */

'use client';

import { User } from 'firebase/auth';
import { logger } from '@/lib/utils/logger';

/**
 * Send professional welcome email to new user
 */
export async function sendWelcomeEmail(user: User): Promise<void> {
  try {
    console.log('📧 Sending professional welcome email to:', user.email);
    
    const response = await fetch('/api/send-welcome-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: user.email,
        displayName: user.displayName || undefined,
        userId: user.uid
      })
    });

    if (!response.ok) {
      const error = await response.json();
      console.warn('⚠️ Welcome email API error (non-critical):', error);
      // Don't throw - welcome email failure shouldn't block sign-up
      return;
    }

    const result = await response.json();
    console.log('✅ Professional welcome email sent successfully:', result.messageId);
  } catch (error) {
    logger.error('Error sending welcome email:', error);
    // Don't throw - welcome email failure shouldn't block sign-up
  }
}

