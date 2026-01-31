import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { db } from '@/lib/firebase/config';
import { doc, updateDoc, setDoc } from 'firebase/firestore';

// Validate Stripe secret key before initializing
const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
if (!stripeSecretKey || stripeSecretKey.trim() === '') {
  console.error('❌ STRIPE_SECRET_KEY is not configured');
}

const stripe = stripeSecretKey ? new Stripe(stripeSecretKey) : null;

// Support multiple webhook secrets (Stripe may create multiple destinations).
// Provide as comma-separated values in STRIPE_WEBHOOK_SECRET:
//   STRIPE_WEBHOOK_SECRET=whsec_a,whsec_b
const webhookSecrets = (process.env.STRIPE_WEBHOOK_SECRET || '')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);

export async function POST(request: NextRequest) {
  if (!db) {
    return NextResponse.json(
      { error: 'Firebase not configured' },
      { status: 500 }
    );
  }

  if (!stripe || !stripeSecretKey) {
    console.error('❌ Stripe not configured: STRIPE_SECRET_KEY is missing');
    return NextResponse.json(
      { error: 'Stripe is not configured. Please set STRIPE_SECRET_KEY environment variable.' },
      { status: 503 }
    );
  }

  const body = await request.text();
  const signature = request.headers.get('stripe-signature');

  if (!signature) {
    return NextResponse.json({ error: 'No signature' }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
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

    if (lastErr) {
      throw lastErr;
    }
  } catch (err: any) {
    console.error('Webhook signature verification failed:', err.message);
    return NextResponse.json({ error: err.message }, { status: 400 });
  }

  try {
    // Handle checkout.session.completed
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session;
      const userId = session.metadata?.userId || session.client_reference_id;
      const paymentType = session.metadata?.type || (session.mode === 'subscription' ? 'subscription' : 'donation');

      if (paymentType === 'subscription' && userId) {
        // Retrieve the subscription for authoritative fields (status, current_period_end, price id).
        // The Checkout Session itself does not contain the subscription period end.
        let stripeSubscription: Stripe.Subscription | null = null;
        try {
          if (session.subscription) {
            stripeSubscription = await stripe.subscriptions.retrieve(session.subscription as string);
          }
        } catch (e) {
          console.error('⚠️ Failed to retrieve Stripe subscription after checkout:', e);
        }

        const currentPeriodEnd =
          stripeSubscription && (stripeSubscription as any).current_period_end
            ? new Date(((stripeSubscription as any).current_period_end as number) * 1000).toISOString()
            : undefined;

        const stripePriceId =
          stripeSubscription?.items?.data?.[0]?.price?.id || undefined;

        // Handle subscription activation
        const userRef = doc(db, 'users', userId);
        await setDoc(
          userRef,
          {
            subscription: {
              // Use Stripe's status when available; fallback to active.
              status: (stripeSubscription?.status as any) || 'active',
              plan: 'pro',
              stripeCustomerId: session.customer as string,
              stripeSubscriptionId: session.subscription as string,
              ...(stripePriceId ? { stripePriceId } : {}),
              ...(currentPeriodEnd ? { currentPeriodEnd } : {}),
            },
            updatedAt: new Date().toISOString(),
          },
          { merge: true }
        );
        console.log('✅ Subscription activated for user:', userId);
      } else if (paymentType === 'donation') {
        // Handle donation - log it (optional: store in donations collection)
        console.log('✅ Donation received:', {
          amount: session.amount_total ? session.amount_total / 100 : 0,
          userId: userId || 'anonymous',
          email: session.customer_email,
        });
        // Optional: Store donation in Firestore
        // You could create a 'donations' collection if you want to track them
      }
    }

    // Handle customer.subscription.updated
    if (event.type === 'customer.subscription.updated') {
      const subscription = event.data.object as Stripe.Subscription;
      const userId = subscription.metadata?.userId;

      if (userId) {
        const userRef = doc(db, 'users', userId);
        const periodEnd = (subscription as any).current_period_end;
        const stripePriceId = subscription.items?.data?.[0]?.price?.id;
        await updateDoc(userRef, {
          // Persist Stripe status as-is when it matches our allowed values.
          // Stripe statuses include: trialing, active, past_due, canceled, unpaid, incomplete, incomplete_expired, paused.
          // We store a subset; map unknowns to 'canceled' to be safe.
          'subscription.status': (['active', 'canceled', 'past_due', 'trialing', 'incomplete'] as const).includes(subscription.status as any)
            ? subscription.status
            : 'canceled',
          'subscription.currentPeriodEnd': periodEnd
            ? new Date(periodEnd * 1000).toISOString()
            : undefined,
          ...(stripePriceId ? { 'subscription.stripePriceId': stripePriceId } : {}),
          updatedAt: new Date().toISOString(),
        });
        console.log('✅ Subscription updated for user:', userId);
      }
    }

    // Handle customer.subscription.deleted
    if (event.type === 'customer.subscription.deleted') {
      const subscription = event.data.object as Stripe.Subscription;
      const userId = subscription.metadata?.userId;

      if (userId) {
        const userRef = doc(db, 'users', userId);
        await updateDoc(userRef, {
          'subscription.status': 'canceled',
          // Keep Stripe IDs for billing portal/history even after cancel.
          ...(subscription.customer ? { 'subscription.stripeCustomerId': subscription.customer as string } : {}),
          ...(subscription.id ? { 'subscription.stripeSubscriptionId': subscription.id } : {}),
          updatedAt: new Date().toISOString(),
        });
        console.log('✅ Subscription canceled for user:', userId);
      }
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error('Error processing webhook:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}




