import { Resend } from 'resend';
import { NextRequest, NextResponse } from 'next/server';

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

export async function POST(request: NextRequest) {
  try {
    // Parse request body first
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

    const { name, email, message, page } = body;

    // Validate required fields
    if (!message || !message.trim()) {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      );
    }

    // Check if Resend is configured
    const apiKey = process.env.RESEND_API_KEY;
    
    if (!apiKey || !resend) {
      console.error('RESEND_API_KEY is missing. Email service is not configured.');
      return NextResponse.json(
        { 
          error: 'Email service is not configured. Please set RESEND_API_KEY environment variable.',
          hint: 'Make sure to restart your dev server after adding the variable to .env.local, or add it in Vercel dashboard for production.'
        },
        { status: 503 } // Service Unavailable is more appropriate than 500
      );
    }

    // Build email content
    const emailSubject = `Feedback from CompLens${name ? ` - ${name}` : ''}`;
    
    const emailHtml = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #1f2937; border-bottom: 2px solid #e5e7eb; padding-bottom: 10px;">
          Feedback Submission
        </h2>
        
        <div style="background-color: #f9fafb; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <h3 style="color: #374151; margin-top: 0;">Feedback Details</h3>
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

Name: ${name || 'Not provided'}
Email: ${email || 'Not provided'}
Page: ${page || '/'}

═══════════════════════════════════════════════════════
MESSAGE
═══════════════════════════════════════════════════════

${message.trim()}
`;

    // Send email using Resend
    const { data, error } = await resend.emails.send({
      from: 'CompLens Feedback <onboarding@resend.dev>', // Update this to your verified domain
      to: 'wherdzik@gmail.com',
      replyTo: email || undefined,
      subject: emailSubject,
      html: emailHtml,
      text: emailText,
    });

    if (error) {
      console.error('Resend error:', error);
      
      // Provide more helpful error messages for common issues
      let errorMessage = 'Failed to send email';
      let hint = '';
      
      if (error.message?.toLowerCase().includes('invalid') || error.message?.toLowerCase().includes('api key')) {
        errorMessage = 'Invalid API key';
        hint = 'Please check your RESEND_API_KEY in .env.local. Make sure you\'ve replaced the placeholder with your actual Resend API key from https://resend.com';
      } else if (error.message?.toLowerCase().includes('unauthorized')) {
        errorMessage = 'API key authentication failed';
        hint = 'Your RESEND_API_KEY may be incorrect or expired. Please verify it in your Resend dashboard.';
      } else {
        hint = error.message || 'Unknown error occurred';
      }
      
      return NextResponse.json(
        { 
          error: errorMessage,
          details: error.message,
          hint: hint
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { success: true, messageId: data?.id },
      { status: 200 }
    );
  } catch (error) {
    console.error('Feedback API error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorStack = error instanceof Error ? error.stack : undefined;
    
    // Log full error details for debugging
    console.error('Error details:', {
      message: errorMessage,
      stack: errorStack,
      name: error instanceof Error ? error.name : 'Unknown'
    });
    
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: process.env.NODE_ENV === 'development' ? errorMessage : 'An unexpected error occurred. Please try again later.',
        ...(process.env.NODE_ENV === 'development' && errorStack ? { stack: errorStack } : {})
      },
      { status: 500 }
    );
  }
}

