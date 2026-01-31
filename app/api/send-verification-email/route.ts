import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

export async function POST(request: NextRequest) {
  try {
    if (!resend) {
      return NextResponse.json(
        { error: 'Email service not configured' },
        { status: 500 }
      );
    }

    const body = await request.json();
    const { email, verificationLink, displayName } = body;

    if (!email || !verificationLink) {
      return NextResponse.json(
        { error: 'Email and verification link are required' },
        { status: 400 }
      );
    }

    const emailHtml = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Verify Your Email - CompLens™</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
  <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #f5f5f5;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" style="max-width: 600px; width: 100%; background-color: #ffffff; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
          <!-- Header with Logo -->
          <tr>
            <td style="padding: 48px 40px 32px; text-align: center; border-bottom: 1px solid #e5e7eb;">
              <!-- Logo -->
              <table role="presentation" style="width: 100%; margin-bottom: 20px;">
                <tr>
                  <td align="center">
                    <img src="https://complens-88a4f.web.app/Logo.png" alt="CompLens Logo" width="180" height="auto" style="max-width: 180px; height: auto; display: block; margin: 0 auto;" />
                  </td>
                </tr>
              </table>
              <!-- Company Name -->
              <h1 style="margin: 0; font-size: 28px; font-weight: 600; color: #111827; letter-spacing: -0.5px;">
                Comp<span style="color: #9333ea;">Lens</span><sup style="font-size: 14px; color: #6b7280; font-weight: 400;">™</sup>
              </h1>
              <p style="margin: 8px 0 0; font-size: 14px; color: #6b7280; font-weight: 400;">Provider Compensation Intelligence</p>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 48px 40px 40px;">
              <h2 style="margin: 0 0 24px; font-size: 24px; font-weight: 600; color: #111827; letter-spacing: -0.3px;">
                Verify your email address
              </h2>
              <p style="margin: 0 0 16px; font-size: 16px; line-height: 1.7; color: #374151;">
                ${displayName ? `Hi ${displayName},` : 'Hello,'}
              </p>
              <p style="margin: 0 0 32px; font-size: 16px; line-height: 1.7; color: #374151;">
                Thank you for creating your CompLens™ account! Please verify your email address by clicking the button below. This helps us ensure the security of your account.
              </p>
              
              <!-- CTA Button -->
              <table role="presentation" style="width: 100%; margin: 0 0 32px;">
                <tr>
                  <td align="center">
                    <a href="${verificationLink}" style="display: inline-block; padding: 16px 36px; background-color: #16a34a; color: #ffffff; text-decoration: none; border-radius: 8px; font-size: 16px; font-weight: 600; box-shadow: 0 4px 6px rgba(22, 163, 74, 0.25); letter-spacing: 0.2px;">
                      Verify Email Address
                    </a>
                  </td>
                </tr>
              </table>
              
              <!-- Alternative Link -->
              <table role="presentation" style="width: 100%; margin: 0;">
                <tr>
                  <td>
                    <p style="margin: 0 0 12px; font-size: 14px; line-height: 1.6; color: #6b7280;">
                      Or copy and paste this link into your browser:
                    </p>
                    <p style="margin: 0; font-size: 12px; line-height: 1.6; color: #9333ea; word-break: break-all; font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace; background-color: #f9fafb; padding: 12px; border-radius: 6px; border: 1px solid #e5e7eb;">
                      ${verificationLink}
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- Security Notice -->
          <tr>
            <td style="padding: 0 40px 40px;">
              <table role="presentation" style="width: 100%; background-color: #fef3c7; border-left: 4px solid #f59e0b; border-radius: 4px;">
                <tr>
                  <td style="padding: 16px 20px;">
                    <p style="margin: 0; font-size: 14px; line-height: 1.6; color: #92400e;">
                      <strong style="font-weight: 600;">Security tip:</strong> This link will expire in 1 hour. If you didn't create a CompLens account, you can safely ignore this email.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding: 36px 40px; background-color: #f9fafb; border-top: 1px solid #e5e7eb; border-radius: 0 0 8px 8px;">
              <p style="margin: 0 0 12px; font-size: 14px; color: #6b7280; text-align: center; line-height: 1.6;">
                This email was sent to <strong style="font-weight: 600; color: #111827;">${email}</strong>
              </p>
              <p style="margin: 0; font-size: 12px; color: #9ca3af; text-align: center; line-height: 1.6;">
                © ${new Date().getFullYear()} CompLens™. All rights reserved.
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
Verify Your Email Address - CompLens™

${displayName ? `Hi ${displayName},` : 'Hello,'}

Thank you for creating your CompLens™ account! Please verify your email address by clicking the link below:

${verificationLink}

This link will expire in 1 hour.

If you didn't create a CompLens account, you can safely ignore this email.

---
This email was sent to ${email}
© ${new Date().getFullYear()} CompLens™. All rights reserved.
    `;

    const { data, error } = await resend.emails.send({
      from: 'CompLens <onboarding@resend.dev>', // Update with your verified domain when available
      to: email,
      subject: 'Verify your email address - CompLens™',
      html: emailHtml,
      text: emailText,
    });

    if (error) {
      console.error('Resend error:', error);
      return NextResponse.json(
        { error: 'Failed to send email', details: error },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { success: true, messageId: data?.id },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Error sending verification email:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

