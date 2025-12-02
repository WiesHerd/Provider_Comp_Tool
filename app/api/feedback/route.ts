import { Resend } from 'resend';
import { NextRequest, NextResponse } from 'next/server';

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

export async function POST(request: NextRequest) {
  try {
    // Check if Resend is configured
    if (!resend || !process.env.RESEND_API_KEY) {
      return NextResponse.json(
        { error: 'Email service is not configured. Please set RESEND_API_KEY environment variable.' },
        { status: 500 }
      );
    }

    const body = await request.json();
    const { name, email, message, page } = body;

    // Validate required fields
    if (!message || !message.trim()) {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
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
      return NextResponse.json(
        { error: 'Failed to send email', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { success: true, messageId: data?.id },
      { status: 200 }
    );
  } catch (error) {
    console.error('Feedback API error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

