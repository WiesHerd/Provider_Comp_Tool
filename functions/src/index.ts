import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { Resend } from 'resend';

// Initialize Firebase Admin
admin.initializeApp();

// Initialize Resend
const resend = new Resend(process.env.RESEND_API_KEY || '');

// Admin email to receive feedback
const ADMIN_EMAIL = 'wherdzik@gmail.com';

/**
 * Cloud Function triggered when feedback is created in Firestore
 * Sends professional email notification to admin
 */
export const onFeedbackCreated = functions.firestore
  .document('feedback/{feedbackId}')
  .onCreate(async (snap, context) => {
    const feedback = snap.data();
    const feedbackId = context.params.feedbackId;

    console.log('📧 New feedback received:', feedbackId);

    // Skip if Resend is not configured
    if (!process.env.RESEND_API_KEY) {
      console.warn('⚠️ RESEND_API_KEY not configured. Email notification skipped.');
      return null;
    }

    try {
      // Get user info if userId is available
      let userName = feedback.name || 'Anonymous User';
      let userEmail = feedback.email || 'No email provided';
      
      if (feedback.userId) {
        try {
          const userRecord = await admin.auth().getUser(feedback.userId);
          if (userRecord.email && !feedback.email) {
            userEmail = userRecord.email;
          }
          if (userRecord.displayName && !feedback.name) {
            userName = userRecord.displayName;
          }
        } catch (error) {
          console.warn('Could not fetch user details:', error);
        }
      }

      // Professional email template (Google-style)
      const emailSubject = `New Feedback from CompLens${feedback.name ? ` - ${feedback.name}` : ''}`;
      
      const emailHtml = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>New Feedback - CompLens</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
  <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #f5f5f5;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" style="max-width: 600px; width: 100%; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); border-collapse: collapse;">
          <!-- Header -->
          <tr>
            <td style="padding: 32px 32px 24px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 8px 8px 0 0;">
              <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 600; letter-spacing: -0.5px;">
                New Feedback Received
              </h1>
              <p style="margin: 8px 0 0; color: rgba(255,255,255,0.9); font-size: 14px;">
                CompLens™ Feedback System
              </p>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 32px;">
              <!-- Feedback Details Card -->
              <div style="background-color: #f9fafb; border-radius: 8px; padding: 20px; margin-bottom: 24px; border-left: 4px solid #667eea;">
                <h2 style="margin: 0 0 16px; color: #1f2937; font-size: 18px; font-weight: 600;">
                  Feedback Details
                </h2>
                <table role="presentation" style="width: 100%; border-collapse: collapse;">
                  <tr>
                    <td style="padding: 8px 0; color: #6b7280; font-size: 14px; width: 120px; vertical-align: top;">
                      <strong>From:</strong>
                    </td>
                    <td style="padding: 8px 0; color: #1f2937; font-size: 14px;">
                      ${userName}
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #6b7280; font-size: 14px; vertical-align: top;">
                      <strong>Email:</strong>
                    </td>
                    <td style="padding: 8px 0; color: #1f2937; font-size: 14px;">
                      ${userEmail}
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #6b7280; font-size: 14px; vertical-align: top;">
                      <strong>Page:</strong>
                    </td>
                    <td style="padding: 8px 0; color: #1f2937; font-size: 14px;">
                      ${feedback.page || '/'}
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #6b7280; font-size: 14px; vertical-align: top;">
                      <strong>Submitted:</strong>
                    </td>
                    <td style="padding: 8px 0; color: #1f2937; font-size: 14px;">
                      ${new Date(feedback.createdAt?.toMillis() || Date.now()).toLocaleString('en-US', {
                        dateStyle: 'medium',
                        timeStyle: 'short'
                      })}
                    </td>
                  </tr>
                  ${feedback.userId ? `
                  <tr>
                    <td style="padding: 8px 0; color: #6b7280; font-size: 14px; vertical-align: top;">
                      <strong>User ID:</strong>
                    </td>
                    <td style="padding: 8px 0; color: #1f2937; font-size: 14px; font-family: monospace; font-size: 12px;">
                      ${feedback.userId}
                    </td>
                  </tr>
                  ` : ''}
                </table>
              </div>
              
              <!-- Message Card -->
              <div style="background-color: #ffffff; border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; margin-bottom: 24px;">
                <h2 style="margin: 0 0 12px; color: #1f2937; font-size: 18px; font-weight: 600;">
                  Message
                </h2>
                <div style="color: #374151; font-size: 15px; line-height: 1.6; white-space: pre-wrap; padding: 16px; background-color: #f9fafb; border-radius: 6px; border-left: 4px solid #10b981;">
                  ${feedback.message || 'No message provided'}
                </div>
              </div>
              
              <!-- Action Button -->
              <table role="presentation" style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td align="center" style="padding: 16px 0 0;">
                    <a href="https://console.firebase.google.com/project/complens-88a4f/firestore/data/~2Ffeedback~2F${feedbackId}" 
                       style="display: inline-block; padding: 12px 24px; background-color: #667eea; color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 14px;">
                      View in Firebase Console
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding: 24px 32px; background-color: #f9fafb; border-top: 1px solid #e5e7eb; border-radius: 0 0 8px 8px;">
              <p style="margin: 0; color: #6b7280; font-size: 12px; text-align: center;">
                This is an automated notification from CompLens™ Feedback System.<br>
                Feedback ID: ${feedbackId}
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
      `;

      const emailText = `
New Feedback from CompLens

═══════════════════════════════════════════════════════
FEEDBACK DETAILS
═══════════════════════════════════════════════════════

From: ${userName}
Email: ${userEmail}
Page: ${feedback.page || '/'}
Submitted: ${new Date(feedback.createdAt?.toMillis() || Date.now()).toLocaleString()}
${feedback.userId ? `User ID: ${feedback.userId}` : ''}

═══════════════════════════════════════════════════════
MESSAGE
═══════════════════════════════════════════════════════

${feedback.message || 'No message provided'}

═══════════════════════════════════════════════════════

View in Firebase Console:
https://console.firebase.google.com/project/complens-88a4f/firestore/data/~2Ffeedback~2F${feedbackId}

Feedback ID: ${feedbackId}
      `.trim();

      // Send email via Resend
      const { data, error } = await resend.emails.send({
        from: 'CompLens Feedback <onboarding@resend.dev>', // Update with your domain when available
        to: ADMIN_EMAIL,
        reply_to: userEmail !== 'No email provided' ? userEmail : undefined,
        subject: emailSubject,
        html: emailHtml,
        text: emailText,
      });

      if (error) {
        console.error('❌ Resend error:', error);
        throw error;
      }

      console.log('✅ Feedback email sent successfully:', data?.id);
      return { success: true, messageId: data?.id };
    } catch (error) {
      console.error('❌ Error sending feedback email:', error);
      // Don't throw - we don't want to fail the function if email fails
      // The feedback is already saved to Firestore
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  });

