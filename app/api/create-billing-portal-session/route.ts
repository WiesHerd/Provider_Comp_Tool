import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';

// Validate Stripe secret key before initializing
const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
if (!stripeSecretKey || stripeSecretKey.trim() === '') {
  console.error('❌ STRIPE_SECRET_KEY is not configured');
}

const stripe = stripeSecretKey ? new Stripe(stripeSecretKey) : null;

export async function POST(request: NextRequest) {
  try {
    if (!stripe || !stripeSecretKey) {
      return NextResponse.json(
        {
          error: 'Stripe is not configured. Please set STRIPE_SECRET_KEY environment variable.',
          help: 'Add STRIPE_SECRET_KEY to your environment variables (Vercel, Firebase Functions, or .env.local)',
        },
        { status: 503 }
      );
    }

    const { customerId, returnPath = '/pricing' } = await request.json();

    if (!customerId || typeof customerId !== 'string' || !customerId.startsWith('cus_')) {
      return NextResponse.json({ error: 'Valid Stripe customerId (cus_...) is required' }, { status: 400 });
    }

    const origin = request.headers.get('origin') || 'http://localhost:3002';
    const returnUrl = `${origin}${returnPath.startsWith('/') ? returnPath : `/${returnPath}`}`;

    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: returnUrl,
    });

    return NextResponse.json({ url: session.url });
  } catch (error: any) {
    console.error('Stripe billing portal error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create billing portal session' },
      { status: 500 }
    );
  }
}


