'use client';

import { useMemo, useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Check, Zap, Crown, Loader2, Clock, AlertCircle, Heart } from 'lucide-react';
import { useAuthStore } from '@/lib/store/auth-store';
import { useRouter, useSearchParams } from 'next/navigation';
import { useTrialStatus } from '@/hooks/use-trial-status';
import { cn } from '@/lib/utils/cn';
import { isPaidEntitlement } from '@/lib/utils/entitlements';

const plans = [
  {
    name: 'Free',
    price: '$0',
    period: 'forever',
    description: 'Perfect for trying out CompLens',
    features: [
      'Basic wRVU calculations',
      'FMV analysis',
      'Up to 5 saved scenarios',
      'Community support',
    ],
    cta: 'Current Plan',
    popular: false,
    priceId: null,
  },
  {
    name: 'Pro',
    price: '$99',
    period: 'year',
    description: 'For serious compensation administrators',
    features: [
      'Unlimited scenarios',
      'Advanced CF modeling',
      'Bulk contract generation',
      'Priority support',
      'Export to PDF/DOCX',
    ],
    cta: 'Upgrade to Pro',
    popular: true,
    // IMPORTANT: avoid using fake placeholder IDs in production.
    // If missing, we disable checkout and show a clear configuration message.
    priceId: process.env.NEXT_PUBLIC_STRIPE_PRO_PRICE_ID || null,
  },
];

export default function PricingClient() {
  const { user, loading: authLoading, initialized } = useAuthStore();
  const { userProfile, isTrialActive, daysRemaining, needsUpgrade, hasValidSubscription, entitlement, refreshProfile, loading: trialLoading } = useTrialStatus();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showCanceled, setShowCanceled] = useState(false);
  const [activating, setActivating] = useState(false);
  const [donationAmount, setDonationAmount] = useState('10');

  const stripeConfigured = useMemo(() => {
    const hasPublishable = !!process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
    const hasPrice = !!process.env.NEXT_PUBLIC_STRIPE_PRO_PRICE_ID;
    return hasPublishable && hasPrice;
  }, []);

  useEffect(() => {
    if (searchParams.get('success') === 'true') {
      const type = searchParams.get('type');
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 5000);
      if (type === 'donation') {
        // Show special message for donations
      }
    }
    if (searchParams.get('canceled') === 'true') {
      setShowCanceled(true);
      setTimeout(() => setShowCanceled(false), 5000);
    }
  }, [searchParams]);

  // After returning from Stripe, webhooks may take a few seconds to update Firestore.
  // Provide an "Apple-like" smooth activation experience by polling the profile briefly.
  useEffect(() => {
    if (!user) return;
    if (searchParams.get('success') !== 'true') return;
    if (searchParams.get('type') === 'donation') return;

    if (isPaidEntitlement(entitlement)) {
      setActivating(false);
      return;
    }

    let cancelled = false;
    setActivating(true);

    const start = Date.now();
    const maxMs = 20000;
    const intervalMs = 1500;

    const tick = async () => {
      if (cancelled) return;
      try {
        await refreshProfile();
      } finally {
        if (cancelled) return;
        if (isPaidEntitlement(entitlement)) {
          setActivating(false);
          return;
        }
        if (Date.now() - start >= maxMs) {
          setActivating(false);
          return;
        }
        setTimeout(tick, intervalMs);
      }
    };

    // Small initial delay to give the webhook a chance to land first.
    const t = setTimeout(tick, 800);

    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [user, entitlement, refreshProfile, searchParams]);

  const handleCheckout = async (priceId: string) => {
    // If pricing isn't configured, show a clear message instead of failing in Stripe.
    if (!priceId || !priceId.startsWith('price_')) {
      alert([
        'We can’t start checkout right now.',
        '',
        'Payments are not configured on this environment.',
        'Admin: set NEXT_PUBLIC_STRIPE_PRO_PRICE_ID (price_...) and STRIPE_SECRET_KEY, then redeploy.',
      ].join('\n'));
      return;
    }

    // Wait for auth to initialize
    if (authLoading || !initialized) {
      console.log('Auth still loading, please wait...');
      return;
    }

    if (!user || !user.uid) {
      router.push('/auth?redirect=/pricing');
      return;
    }

    setLoading(priceId);
    try {
      // Create checkout session
      const response = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ priceId, userId: user.uid, mode: 'subscription' }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.error || 'Failed to create checkout session';
        const helpText = errorData.help ? `\n\n${errorData.help}` : '';
        throw new Error(`${errorMessage}${helpText}`);
      }

      const { url } = await response.json();

      if (url) {
        // Redirect directly to Stripe Checkout using the session URL
        window.location.href = url;
      } else {
        throw new Error('No checkout URL received');
      }
    } catch (error) {
      console.error('Checkout error:', error);
      const message = error instanceof Error ? error.message : 'Something went wrong. Please try again.';
      alert(message);
    } finally {
      setLoading(null);
    }
  };

  const handleManageBilling = async () => {
    const customerId = userProfile?.subscription?.stripeCustomerId;
    if (!customerId || !customerId.startsWith('cus_')) {
      alert(
        [
          'Billing portal is not available for this account yet.',
          '',
          'If you just upgraded, please refresh in a minute.',
        ].join('\n')
      );
      return;
    }

    setLoading('billing-portal');
    try {
      const response = await fetch('/api/create-billing-portal-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerId,
          returnPath: '/pricing',
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.error || 'Failed to open billing portal';
        const helpText = errorData.help ? `\n\n${errorData.help}` : '';
        throw new Error(`${errorMessage}${helpText}`);
      }

      const { url } = await response.json();
      if (url) {
        window.location.href = url;
      } else {
        throw new Error('No portal URL received');
      }
    } catch (error) {
      console.error('Billing portal error:', error);
      const message = error instanceof Error ? error.message : 'Something went wrong. Please try again.';
      alert(message);
    } finally {
      setLoading(null);
    }
  };

  const handleDonation = async () => {
    const amount = parseFloat(donationAmount);
    if (isNaN(amount) || amount < 1) {
      alert('Please enter a valid amount (minimum $1)');
      return;
    }

    setLoading('donation');
    try {
      const response = await fetch('/api/create-donation-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          amount,
          userId: user?.uid,
          email: user?.email,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.error || 'Failed to create donation session';
        const helpText = errorData.help ? `\n\n${errorData.help}` : '';
        throw new Error(`${errorMessage}${helpText}`);
      }

      const { url } = await response.json();

      if (url) {
        window.location.href = url;
      } else {
        throw new Error('No checkout URL received');
      }
    } catch (error) {
      console.error('Donation error:', error);
      const message = error instanceof Error ? error.message : 'Something went wrong. Please try again.';
      alert(message);
    } finally {
      setLoading(null);
      // setShowDonationModal(false); // Reserved for future modal implementation
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Success/Cancel Messages */}
        {showSuccess && (
          <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
            <p className="text-green-800 dark:text-green-200">
              {searchParams.get('type') === 'donation' 
                ? '✅ Thank you for your donation! Your support means the world to us.'
                : '✅ Payment successful! Your subscription is now active.'}
            </p>
          </div>
        )}
        {activating && (
          <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg flex items-center gap-3">
            <Loader2 className="w-4 h-4 animate-spin text-blue-700 dark:text-blue-200" />
            <p className="text-blue-800 dark:text-blue-200 text-sm">
              Finalizing your upgrade… this usually takes a few seconds.
            </p>
          </div>
        )}
        {showCanceled && (
          <div className="mb-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
            <p className="text-yellow-800 dark:text-yellow-200">
              Payment was canceled. You can try again anytime.
            </p>
          </div>
        )}

        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4 text-gray-900 dark:text-white">
            Choose Your Plan
          </h1>
          <p className="text-gray-600 dark:text-gray-400 text-lg">
            Start free, upgrade when you need more power
          </p>

          {/* Manage billing (paid users) */}
          {user && hasValidSubscription && (
            <div className="mt-5 flex items-center justify-center gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={handleManageBilling}
                disabled={loading !== null || trialLoading}
              >
                {loading === 'billing-portal' ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Opening billing…
                  </>
                ) : (
                  'Manage billing'
                )}
              </Button>
              <Button
                type="button"
                variant="ghost"
                onClick={() => refreshProfile()}
                disabled={trialLoading}
              >
                {trialLoading ? 'Refreshing…' : 'Refresh'}
              </Button>
            </div>
          )}
          
          {/* Trial Status Banner */}
          {user && (
            <div className="mt-6">
              {isTrialActive && daysRemaining > 0 && (
                <div className={cn(
                  "inline-flex items-center gap-2 px-4 py-2 rounded-lg border",
                  daysRemaining <= 3
                    ? "bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800 text-orange-800 dark:text-orange-200"
                    : "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 text-blue-800 dark:text-blue-200"
                )}>
                  <Clock className="w-4 h-4" />
                  <span className="text-sm font-medium">
                    {daysRemaining} {daysRemaining === 1 ? 'day' : 'days'} left in your free trial
                    {daysRemaining <= 3 && ' - Upgrade now to continue!'}
                  </span>
                </div>
              )}
              {needsUpgrade && (
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-800 dark:text-red-200">
                  <AlertCircle className="w-4 h-4" />
                  <span className="text-sm font-medium">
                    Your trial has ended. Upgrade to continue using CompLens.
                  </span>
                </div>
              )}
              {hasValidSubscription && !isTrialActive && (
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 text-green-800 dark:text-green-200">
                  <Zap className="w-4 h-4" />
                  <span className="text-sm font-medium">
                    You're on the Pro plan
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Stripe configuration hint (visible in misconfigured deploys) */}
          {!stripeConfigured && (
            <div className="mt-6 max-w-2xl mx-auto rounded-xl border border-amber-200/70 dark:border-amber-800/60 bg-amber-50/70 dark:bg-amber-950/25 px-4 py-3 text-left">
              <p className="text-sm font-semibold text-amber-900 dark:text-amber-200">
                Payments temporarily unavailable
              </p>
              <p className="text-xs text-amber-800/90 dark:text-amber-300/90 mt-1">
                If you're an admin: set <span className="font-mono">NEXT_PUBLIC_STRIPE_PRO_PRICE_ID</span> and redeploy.
                If you're a user: please contact support and we’ll get you upgraded immediately.
              </p>
            </div>
          )}
        </div>

        <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          {plans.map((plan) => (
            <Card
              key={plan.name}
              className={cn(
                "relative",
                plan.popular && 'border-2 border-purple-500 shadow-lg scale-105',
                isTrialActive && daysRemaining <= 3 && plan.name === 'Pro' && 'ring-2 ring-orange-400 ring-offset-2'
              )}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                  <span className="bg-purple-500 text-white px-4 py-1 rounded-full text-sm font-medium">
                    Most Popular
                  </span>
                </div>
              )}
              <CardHeader>
                <div className="flex items-center gap-2 mb-2">
                  {plan.name === 'Pro' && <Zap className="w-5 h-5 text-purple-500" />}
                  {plan.name === 'Enterprise' && <Crown className="w-5 h-5 text-yellow-500" />}
                  <CardTitle className="text-2xl">{plan.name}</CardTitle>
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-bold text-gray-900 dark:text-white">
                    {plan.price}
                  </span>
                  {plan.period && (
                    <span className="text-gray-500 dark:text-gray-400">/{plan.period}</span>
                  )}
                </div>
                {plan.name === 'Pro' && (
                  <p className="text-sm text-green-600 dark:text-green-400 font-medium mt-1">
                    Save 72% vs monthly billing
                  </p>
                )}
                <CardDescription className="mt-2">{plan.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3 mb-6">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-center gap-2">
                      <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
                      <span className="text-gray-700 dark:text-gray-300">{feature}</span>
                    </li>
                  ))}
                </ul>
                <Button
                  className="w-full"
                  variant={plan.popular ? 'default' : 'outline'}
                  onClick={() => {
                    if (plan.priceId) {
                      handleCheckout(plan.priceId);
                    } else if (plan.name !== 'Free') {
                      alert(
                        'Payments are not configured yet.\n\n' +
                          'Missing NEXT_PUBLIC_STRIPE_PRO_PRICE_ID. Please contact support.'
                      );
                    }
                  }}
                  // Never dead-end users with a disabled upgrade button.
                  // Free is disabled because it isn't a checkout flow.
                  disabled={loading !== null || plan.name === 'Free'}
                >
                  {loading !== null && loading === plan.priceId ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    plan.cta
                  )}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="mt-12 text-center space-y-4">
          {!user || (!isTrialActive && !needsUpgrade) ? (
            <p className="text-sm text-gray-500 dark:text-gray-400">
              New users get a 14-day free trial. Cancel anytime.
            </p>
          ) : null}
          
          {/* Donation Section */}
          <div className="mt-8 p-6 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
            <div className="flex items-center justify-center gap-2 mb-3">
              <Heart className="w-5 h-5 text-pink-500 fill-pink-500" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Support CompLens
              </h3>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Love CompLens? Consider making a donation to help us continue improving the platform!
            </p>
            <div className="flex flex-col sm:flex-row gap-3 items-center justify-center max-w-md mx-auto">
              <div className="flex items-center gap-2">
                <span className="text-gray-700 dark:text-gray-300">$</span>
                <input
                  type="number"
                  min="1"
                  step="1"
                  value={donationAmount}
                  onChange={(e) => setDonationAmount(e.target.value)}
                  className="w-24 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  placeholder="10"
                />
              </div>
              <Button
                onClick={handleDonation}
                disabled={loading === 'donation'}
                variant="outline"
                className="border-pink-300 dark:border-pink-700 text-pink-700 dark:text-pink-300 hover:bg-pink-50 dark:hover:bg-pink-900/20"
              >
                {loading === 'donation' ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Heart className="w-4 h-4 mr-2" />
                    Donate
                  </>
                )}
              </Button>
            </div>
          </div>

          <p className="text-xs text-gray-400 dark:text-gray-500">
            {process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY?.startsWith('pk_test_') ? (
              <>🧪 <strong>Test mode</strong> — Using Stripe test cards (no real charges)</>
            ) : (
              <>💳 <strong>Live mode enabled</strong> — All payments are processed securely through Stripe</>
            )}
          </p>
        </div>
      </div>
    </div>
  );
}

