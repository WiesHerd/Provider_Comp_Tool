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

    const { priceId, userId, mode = 'subscription', amount } = await request.json();

    if (!priceId && !amount) {
      return NextResponse.json(
        { error: 'Price ID or amount is required' },
        { status: 400 }
      );
    }

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 401 }
      );
    }

    const origin = request.headers.get('origin') || 'http://localhost:3002';
    const isProduction = origin.includes('complens-88a4f') || origin.includes('complens.com');

    // Determine if this is a subscription or one-time payment
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

    // Add line items based on mode
    if (isSubscription && priceId) {
      // Subscription mode - use price ID
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
      // One-time payment mode - use amount
      sessionConfig.line_items = [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: 'Support CompLens',
              description: 'Thank you for supporting CompLens development!',
            },
            unit_amount: Math.round(amount * 100), // Convert to cents
          },
          quantity: 1,
        },
      ];
    }

    // Professional branding customization
    if (isProduction) {
      // Add your logo URL (upload to Stripe Dashboard or use your hosted logo)
      // sessionConfig.logo_url = 'https://complens-88a4f.web.app/Logo.png';
    }

    const session = await stripe.checkout.sessions.create(sessionConfig);

    return NextResponse.json({ 
      sessionId: session.id,
      url: session.url 
    });
  } catch (error: any) {
    console.error('Stripe error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create checkout session' },
      { status: 500 }
    );
  }
}

