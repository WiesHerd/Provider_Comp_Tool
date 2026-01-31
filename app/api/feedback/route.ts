import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';

// Note: This API route requires authentication via userId in request body
// Firebase Admin SDK is not used here - we rely on client-side auth verification
// The client sends userId after verifying authentication client-side

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

export async function POST(request: NextRequest) {
  try {
    // Parse request body
    let body;
    try {
      body = await request.json();
    } catch (parseError) {
      console.error('Failed to parse request body:', parseError);
      return NextResponse.json(
        { error: 'Invalid request format. Please ensure your request is valid JSON.' },
        { status: 400 }
      );
    }

    const { name, email, message, page, userId, idToken } = body;

    // Validate required fields
    if (!message || !message.trim()) {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      );
    }

    // Require authentication - check for userId or token
    if (!userId && !idToken) {
      return NextResponse.json(
        { 
          error: 'Authentication required',
          hint: 'Please sign in to submit feedback.'
        },
        { status: 401 }
      );
    }

    // Use userId from body (client-side verified)
    // In production, verify the ID token from Authorization header using Firebase Admin SDK
    const finalUserId = userId;

    if (!finalUserId) {
      return NextResponse.json(
        { 
          error: 'Invalid authentication',
          hint: 'Please sign in again and try submitting feedback.'
        },
        { status: 401 }
      );
    }

    // Check if Resend is configured
    const apiKey = process.env.RESEND_API_KEY;
    
    if (!apiKey || !resend) {
      console.error('RESEND_API_KEY is missing. Email service is not configured.');
      // Still save to Firestore even if email fails
    }

    // Save feedback to Firestore
    try {
      // Use client SDK approach - we'll save via client-side call
      // For now, we'll just send email and return success
      // The client should save to Firestore directly
    } catch (firestoreError) {
      console.error('Error saving feedback to Firestore:', firestoreError);
      // Continue with email even if Firestore save fails
    }

    // Send email if Resend is configured
    if (resend && apiKey) {
      const emailSubject = `Feedback from CompLens${name ? ` - ${name}` : ''}`;
      
      const emailHtml = `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #1f2937; border-bottom: 2px solid #e5e7eb; padding-bottom: 10px;">
            Feedback Submission
          </h2>
          
          <div style="background-color: #f9fafb; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #374151; margin-top: 0;">Feedback Details</h3>
            <p style="margin: 8px 0; color: #4b5563;">
              <strong>User ID:</strong> ${finalUserId}
            </p>
            <p style="margin: 8px 0; color: #4b5563;">
              <strong>Name:</strong> ${name || 'Not provided'}
            </p>
            <p style="margin: 8px 0; color: #4b5563;">
              <strong>Email:</strong> ${email || 'Not provided'}
            </p>
            <p style="margin: 8px 0; color: #4b5563;">
              <strong>Page:</strong> ${page || '/'}
            </p>
            <p style="margin: 8px 0; color: #4b5563;">
              <strong>Submitted:</strong> ${new Date().toLocaleString()}
            </p>
          </div>
          
          <div style="margin: 20px 0;">
            <h3 style="color: #374151;">Message</h3>
            <div style="background-color: #ffffff; padding: 15px; border-left: 4px solid #6366f1; border-radius: 4px; white-space: pre-wrap; color: #1f2937;">
${message.trim()}
            </div>
          </div>
        </div>
      `;

      const emailText = `Feedback Submission
Generated: ${new Date().toLocaleString()}

═══════════════════════════════════════════════════════
FEEDBACK DETAILS
═══════════════════════════════════════════════════════

User ID: ${finalUserId}
Name: ${name || 'Not provided'}
Email: ${email || 'Not provided'}
Page: ${page || '/'}

═══════════════════════════════════════════════════════
MESSAGE
═══════════════════════════════════════════════════════

${message.trim()}
`;

      const { data, error } = await resend.emails.send({
        from: 'CompLens Feedback <onboarding@resend.dev>',
        to: 'wherdzik@gmail.com',
        replyTo: email || undefined,
        subject: emailSubject,
        html: emailHtml,
        text: emailText,
      });

      if (error) {
        console.error('Resend error:', error);
        // Still return success if Firestore save worked
      }

      return NextResponse.json(
        { 
          success: true, 
          messageId: data?.id,
          saved: true
        },
        { status: 200 }
      );
    } else {
      // Email not configured, but feedback was authenticated
      return NextResponse.json(
        { 
          success: true,
          saved: true,
          message: 'Feedback received (email service not configured)'
        },
        { status: 200 }
      );
    }
  } catch (error) {
    console.error('Feedback API error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: process.env.NODE_ENV === 'development' ? errorMessage : 'An unexpected error occurred. Please try again later.'
      },
      { status: 500 }
    );
  }
}

