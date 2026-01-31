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
    const { email, displayName, userId } = body;

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    const emailHtml = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to CompLens™</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
  <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #f5f5f5;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" style="max-width: 600px; width: 100%; background-color: #ffffff; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
          <!-- Header with Logo -->
          <tr>
            <td style="padding: 48px 40px 32px; text-align: center; background: linear-gradient(135deg, #16a34a 0%, #15803d 100%); border-radius: 8px 8px 0 0;">
              <!-- Logo -->
              <table role="presentation" style="width: 100%; margin-bottom: 24px;">
                <tr>
                  <td align="center">
                    <img src="https://complens-88a4f.web.app/Logo.png" alt="CompLens Logo" width="180" height="auto" style="max-width: 180px; height: auto; display: block; margin: 0 auto;" />
                  </td>
                </tr>
              </table>
              <!-- Company Name -->
              <h1 style="margin: 0; font-size: 32px; font-weight: 700; color: #ffffff; letter-spacing: -0.5px;">
                Welcome to Comp<span style="color: #fbbf24;">Lens</span><sup style="font-size: 16px; color: #ffffff; font-weight: 400;">™</sup>
              </h1>
              <p style="margin: 12px 0 0; font-size: 16px; color: #dcfce7; font-weight: 400;">Your account has been successfully created!</p>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 48px 40px 40px;">
              <h2 style="margin: 0 0 24px; font-size: 24px; font-weight: 600; color: #111827; letter-spacing: -0.3px;">
                ${displayName ? `Hi ${displayName},` : 'Hello,'}
              </h2>
              <p style="margin: 0 0 24px; font-size: 16px; line-height: 1.7; color: #374151;">
                We're excited to have you join CompLens™! Your account is now active and ready to use. Get started by exploring our powerful tools for provider compensation intelligence.
              </p>
              
              <!-- Trial Information Banner -->
              <table role="presentation" style="width: 100%; background: linear-gradient(135deg, #9333ea 0%, #3b82f6 100%); border-radius: 8px; margin: 0 0 32px; padding: 24px;">
                <tr>
                  <td style="text-align: center;">
                    <h3 style="margin: 0 0 12px; font-size: 20px; font-weight: 600; color: #ffffff; letter-spacing: -0.2px;">
                      🎉 You're on a 14-day free trial!
                    </h3>
                    <p style="margin: 0; font-size: 15px; line-height: 1.6; color: #f3f4f6;">
                      Explore all features for free. No credit card required. Upgrade anytime to continue after your trial ends.
                    </p>
                  </td>
                </tr>
              </table>
              
              <!-- Account Details -->
              <table role="presentation" style="width: 100%; background-color: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; margin: 0 0 32px;">
                <tr>
                  <td style="padding: 24px;">
                    <h3 style="margin: 0 0 20px; font-size: 18px; font-weight: 600; color: #111827; letter-spacing: -0.2px;">Your Account Details</h3>
                    <table role="presentation" style="width: 100%;">
                      <tr>
                        <td style="padding: 10px 0; font-size: 14px; color: #6b7280; width: 130px; vertical-align: top;">Email:</td>
                        <td style="padding: 10px 0; font-size: 14px; font-weight: 600; color: #111827; vertical-align: top;">${email}</td>
                      </tr>
                      ${userId ? `
                      <tr>
                        <td style="padding: 10px 0; font-size: 14px; color: #6b7280; vertical-align: top;">Account ID:</td>
                        <td style="padding: 10px 0; font-size: 12px; font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace; color: #6b7280; vertical-align: top;">${userId.substring(0, 8)}...</td>
                      </tr>
                      ` : ''}
                      <tr>
                        <td style="padding: 10px 0; font-size: 14px; color: #6b7280; vertical-align: top;">Status:</td>
                        <td style="padding: 10px 0; vertical-align: top;">
                          <span style="display: inline-block; padding: 6px 14px; background-color: #dcfce7; color: #166534; border-radius: 16px; font-size: 12px; font-weight: 600; letter-spacing: 0.3px;">Active</span>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
              
              <!-- CTA Button -->
              <table role="presentation" style="width: 100%; margin: 0 0 40px;">
                <tr>
                  <td align="center">
                    <a href="https://complens-88a4f.web.app" style="display: inline-block; padding: 16px 36px; background-color: #16a34a; color: #ffffff; text-decoration: none; border-radius: 8px; font-size: 16px; font-weight: 600; box-shadow: 0 4px 6px rgba(22, 163, 74, 0.25); letter-spacing: 0.2px;">
                      Get Started
                    </a>
                  </td>
                </tr>
              </table>
              
              <!-- Features -->
              <table role="presentation" style="width: 100%; margin: 0;">
                <tr>
                  <td>
                    <h3 style="margin: 0 0 24px; font-size: 18px; font-weight: 600; color: #111827; letter-spacing: -0.2px;">What you can do with CompLens™:</h3>
                    <table role="presentation" style="width: 100%;">
                      <tr>
                        <td style="padding: 14px 0; border-bottom: 1px solid #e5e7eb;">
                          <p style="margin: 0; font-size: 15px; line-height: 1.6; color: #374151;">
                            <span style="color: #16a34a; font-weight: 700; margin-right: 8px;">✓</span> Create and save wRVU models
                          </p>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 14px 0; border-bottom: 1px solid #e5e7eb;">
                          <p style="margin: 0; font-size: 15px; line-height: 1.6; color: #374151;">
                            <span style="color: #16a34a; font-weight: 700; margin-right: 8px;">✓</span> Analyze FMV (Fair Market Value) scenarios
                          </p>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 14px 0; border-bottom: 1px solid #e5e7eb;">
                          <p style="margin: 0; font-size: 15px; line-height: 1.6; color: #374151;">
                            <span style="color: #16a34a; font-weight: 700; margin-right: 8px;">✓</span> Model call-pay scenarios
                          </p>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 14px 0;">
                          <p style="margin: 0; font-size: 15px; line-height: 1.6; color: #374151;">
                            <span style="color: #16a34a; font-weight: 700; margin-right: 8px;">✓</span> Access your data from any device
                          </p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding: 36px 40px; background-color: #f9fafb; border-top: 1px solid #e5e7eb; border-radius: 0 0 8px 8px;">
              <p style="margin: 0 0 12px; font-size: 14px; color: #6b7280; text-align: center; line-height: 1.6;">
                Need help? <a href="mailto:support@complens.com" style="color: #9333ea; text-decoration: none; font-weight: 500;">Contact Support</a>
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
Welcome to CompLens™

${displayName ? `Hi ${displayName},` : 'Hello,'}

We're excited to have you join CompLens™! Your account is now active and ready to use.

🎉 You're on a 14-day free trial!
Explore all features for free. No credit card required. Upgrade anytime to continue after your trial ends.

Your Account Details:
Email: ${email}
${userId ? `Account ID: ${userId.substring(0, 8)}...` : ''}
Status: Active

Get started: https://complens-88a4f.web.app

What you can do with CompLens™:
✓ Create and save wRVU models
✓ Analyze FMV (Fair Market Value) scenarios
✓ Model call-pay scenarios
✓ Access your data from any device

Need help? Contact support@complens.com

© ${new Date().getFullYear()} CompLens™. All rights reserved.
    `;

    const { data, error } = await resend.emails.send({
      from: 'CompLens <onboarding@resend.dev>', // Update with your verified domain when available
      to: email,
      subject: 'Welcome to CompLens™ - Your Account is Ready!',
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
    console.error('Error sending welcome email:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

