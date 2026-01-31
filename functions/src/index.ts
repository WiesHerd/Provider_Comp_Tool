import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { Resend } from 'resend';
import Stripe from 'stripe';

// Initialize Firebase Admin
admin.initializeApp();

// Initialize Resend
// Get API key from environment variable (can be set in Firebase Console or .env file)
// Firebase Console: Functions → Configuration → Environment Variables
const resendApiKey = process.env.RESEND_API_KEY || '';
const resend = resendApiKey ? new Resend(resendApiKey) : null;

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
    if (!resend || !resendApiKey) {
      console.warn('⚠️ RESEND_API_KEY not configured. Email notification skipped.');
      console.warn('⚠️ Set it with: firebase functions:config:set resend.api_key="re_xxxxx"');
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

// Initialize Stripe (will use secret from environment)
const getStripe = () => {
  // Prefer Firebase Functions config (firebase functions:config:set),
  // fall back to process.env for local/dev or alternate deploy pipelines.
  const secretKey =
    (functions.config()?.stripe?.secret_key as string | undefined) ||
    process.env.STRIPE_SECRET_KEY ||
    '';
  if (!secretKey) {
    const errorMsg = 'STRIPE_SECRET_KEY environment variable is not set. ' +
      'Please set it in Firebase Console: Functions → Configuration → Environment Variables. ' +
      'Or use: firebase functions:config:set stripe.secret_key="sk_test_..."';
    console.error('❌ Stripe Configuration Error:', errorMsg);
    throw new Error(errorMsg);
  }
  try {
    return new Stripe(secretKey);
  } catch (error) {
    console.error('❌ Stripe Initialization Error:', error);
    throw new Error(`Failed to initialize Stripe: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

/**
 * Create Stripe Checkout Session (for subscriptions)
 */
export const createCheckoutSession = functions.https.onRequest(async (req, res) => {
  // Enable CORS
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(204).send('');
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    const { priceId, userId, mode = 'subscription', amount } = req.body;

    if (!priceId && !amount) {
      res.status(400).json({ error: 'Price ID or amount is required' });
      return;
    }

    if (!userId) {
      res.status(401).json({ error: 'User ID is required' });
      return;
    }

    const origin = req.get('origin') || 'https://complens-88a4f.web.app';

    const isSubscription = mode === 'subscription';
    
    const sessionConfig: Stripe.Checkout.SessionCreateParams = {
      mode: isSubscription ? 'subscription' : 'payment',
      payment_method_types: ['card'],
      success_url: `${origin}/pricing?success=true`,
      cancel_url: `${origin}/pricing?canceled=true`,
      client_reference_id: userId,
      metadata: {
        userId,
        type: isSubscription ? 'subscription' : 'donation',
      },
    };

    if (isSubscription && priceId) {
      sessionConfig.line_items = [
        {
          price: priceId,
          quantity: 1,
        },
      ];
      sessionConfig.subscription_data = {
        metadata: {
          userId,
        },
      };
    } else if (!isSubscription && amount) {
      sessionConfig.line_items = [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: 'Support CompLens',
              description: 'Thank you for supporting CompLens development!',
            },
            unit_amount: Math.round(amount * 100),
          },
          quantity: 1,
        },
      ];
    }

    const stripe = getStripe();
    const session = await stripe.checkout.sessions.create(sessionConfig);

    res.json({ 
      sessionId: session.id,
      url: session.url 
    });
  } catch (error: any) {
    console.error('❌ Stripe checkout error:', error);
    const errorMessage = error.message || 'Failed to create checkout session';
    const statusCode = errorMessage.includes('STRIPE_SECRET_KEY') ? 503 : 500;
    res.status(statusCode).json({
      error: errorMessage,
      ...(errorMessage.includes('STRIPE_SECRET_KEY') && {
        help: 'Set STRIPE_SECRET_KEY in Firebase Console: Functions → Configuration → Environment Variables'
      })
    });
  }
});

/**
 * Create Stripe Donation Session
 */
export const createDonationSession = functions.https.onRequest(async (req, res) => {
  // Enable CORS
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(204).send('');
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    const { amount, userId, email } = req.body;

    if (!amount || amount < 1) {
      res.status(400).json({ error: 'Amount must be at least $1' });
      return;
    }

    const origin = req.get('origin') || 'https://complens-88a4f.web.app';

    const stripe = getStripe();
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: 'Support CompLens',
              description: 'Thank you for supporting CompLens development!',
            },
            unit_amount: Math.round(amount * 100),
          },
          quantity: 1,
        },
      ],
      success_url: `${origin}/pricing?success=true&type=donation`,
      cancel_url: `${origin}/pricing?canceled=true`,
      ...(userId && { client_reference_id: userId }),
      metadata: {
        type: 'donation',
        ...(userId && { userId }),
        ...(email && { email }),
      },
    });

    res.json({ 
      sessionId: session.id,
      url: session.url 
    });
  } catch (error: any) {
    console.error('❌ Stripe donation error:', error);
    const errorMessage = error.message || 'Failed to create donation session';
    const statusCode = errorMessage.includes('STRIPE_SECRET_KEY') ? 503 : 500;
    res.status(statusCode).json({
      error: errorMessage,
      ...(errorMessage.includes('STRIPE_SECRET_KEY') && {
        help: 'Set STRIPE_SECRET_KEY in Firebase Console: Functions → Configuration → Environment Variables'
      })
    });
  }
});

/**
 * Create Stripe Customer Billing Portal session
 */
export const createBillingPortalSession = functions.https.onRequest(async (req, res) => {
  // Enable CORS
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(204).send('');
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    const { customerId, returnPath = '/pricing' } = req.body || {};

    if (!customerId || typeof customerId !== 'string' || !customerId.startsWith('cus_')) {
      res.status(400).json({ error: 'Valid Stripe customerId (cus_...) is required' });
      return;
    }

    const origin = req.get('origin') || 'https://complens-88a4f.web.app';
    const normalizedReturnPath =
      typeof returnPath === 'string' && returnPath.length > 0
        ? (returnPath.startsWith('/') ? returnPath : `/${returnPath}`)
        : '/pricing';

    const stripe = getStripe();
    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: `${origin}${normalizedReturnPath}`,
    });

    res.json({ url: session.url });
  } catch (error: any) {
    console.error('❌ Stripe billing portal error:', error);
    const errorMessage = error.message || 'Failed to create billing portal session';
    const statusCode = errorMessage.includes('STRIPE_SECRET_KEY') ? 503 : 500;
    res.status(statusCode).json({
      error: errorMessage,
      ...(errorMessage.includes('STRIPE_SECRET_KEY') && {
        help: 'Set STRIPE_SECRET_KEY in Firebase Console: Functions → Configuration → Environment Variables',
      }),
    });
  }
});

/**
 * Stripe Webhook Handler
 * Note: Must preserve raw body for signature verification
 */
export const stripeWebhook = functions.runWith({
  // Increase timeout for webhook processing
  timeoutSeconds: 60,
}).https.onRequest(async (req, res) => {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  // Support multiple webhook secrets (Stripe may create multiple destinations).
  // Provide as comma-separated values in STRIPE_WEBHOOK_SECRET:
  //   STRIPE_WEBHOOK_SECRET=whsec_a,whsec_b
  const webhookSecretValue =
    (functions.config()?.stripe?.webhook_secret as string | undefined) ||
    process.env.STRIPE_WEBHOOK_SECRET ||
    '';
  const webhookSecrets = webhookSecretValue
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  const signature = req.get('stripe-signature');

  if (!signature) {
    res.status(400).json({ error: 'No signature' });
    return;
  }

  let event: Stripe.Event | null = null;
  try {
    // For Firebase Functions v1, rawBody should be available
    // If not, we'll need to configure the function differently
    const body = (req as any).rawBody 
      ? Buffer.from((req as any).rawBody).toString('utf8')
      : JSON.stringify(req.body);
    
    const stripe = getStripe();

    // Try each secret until one verifies.
    let lastErr: any = null;
    for (const secret of webhookSecrets) {
      try {
        event = stripe.webhooks.constructEvent(body, signature, secret);
        lastErr = null;
        break;
      } catch (e: any) {
        lastErr = e;
      }
    }

    if (lastErr || !event) {
      throw lastErr;
    }
  } catch (err: any) {
    console.error('Webhook signature verification failed:', err.message);
    res.status(400).json({ error: err.message });
    return;
  }

  try {
    if (event && event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session;
      const userId = session.metadata?.userId || session.client_reference_id;
      const paymentType = session.metadata?.type || (session.mode === 'subscription' ? 'subscription' : 'donation');

      if (paymentType === 'subscription' && userId) {
        const userRef = admin.firestore().doc(`users/${userId}`);
        await userRef.set({
          subscription: {
            status: 'active',
            plan: 'pro',
            stripeCustomerId: session.customer as string,
            stripeSubscriptionId: session.subscription as string,
            currentPeriodEnd: session.expires_at
              ? new Date(session.expires_at * 1000).toISOString()
              : undefined,
          },
          updatedAt: new Date().toISOString(),
        }, { merge: true });
        console.log('✅ Subscription activated for user:', userId);
      } else if (paymentType === 'donation') {
        console.log('✅ Donation received:', {
          amount: session.amount_total ? session.amount_total / 100 : 0,
          userId: userId || 'anonymous',
          email: session.customer_email,
        });
      }
    }

    if (event && event.type === 'customer.subscription.updated') {
      const subscription = event.data.object as Stripe.Subscription;
      const userId = subscription.metadata?.userId;

      if (userId) {
        const userRef = admin.firestore().doc(`users/${userId}`);
        const periodEnd = (subscription as any).current_period_end;
        await userRef.update({
          'subscription.status': subscription.status === 'active' ? 'active' : 'canceled',
          'subscription.currentPeriodEnd': periodEnd
            ? new Date(periodEnd * 1000).toISOString()
            : undefined,
          updatedAt: new Date().toISOString(),
        });
        console.log('✅ Subscription updated for user:', userId);
      }
    }

    if (event && event.type === 'customer.subscription.deleted') {
      const subscription = event.data.object as Stripe.Subscription;
      const userId = subscription.metadata?.userId;

      if (userId) {
        const userRef = admin.firestore().doc(`users/${userId}`);
        await userRef.update({
          'subscription.status': 'canceled',
          updatedAt: new Date().toISOString(),
        });
        console.log('✅ Subscription canceled for user:', userId);
      }
    }

    res.json({ received: true });
  } catch (error: any) {
    console.error('Error processing webhook:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});

