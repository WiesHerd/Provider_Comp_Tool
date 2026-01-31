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
    // Check if Stripe is configured
    if (!stripe || !stripeSecretKey) {
      console.error('❌ Stripe not configured: STRIPE_SECRET_KEY is missing');
      return NextResponse.json(
        { 
          error: 'Stripe is not configured. Please set STRIPE_SECRET_KEY environment variable.',
          help: 'Add STRIPE_SECRET_KEY to your environment variables (Vercel, Firebase Functions, or .env.local)'
        },
        { status: 503 }
      );
    }

    const { amount, userId, email } = await request.json();

    if (!amount || amount < 1) {
      return NextResponse.json(
        { error: 'Amount must be at least $1' },
        { status: 400 }
      );
    }

    const origin = request.headers.get('origin') || 'http://localhost:3002';
    const isProduction = origin.includes('complens-88a4f') || origin.includes('complens.com');

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
            unit_amount: Math.round(amount * 100), // Convert dollars to cents
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
      // Professional branding customization
      ...(isProduction && {
        // Add your logo URL (upload to Stripe Dashboard or use your hosted logo)
        // logo_url: 'https://complens-88a4f.web.app/Logo.png',
      }),
    });

    return NextResponse.json({ 
      sessionId: session.id,
      url: session.url 
    });
  } catch (error: any) {
    console.error('Stripe donation error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create donation session' },
      { status: 500 }
    );
  }
}




