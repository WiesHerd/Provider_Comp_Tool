# Quick script to check and fix .env.local for Stripe Test Mode
# This will help you identify and fix the mode mismatch issue

Write-Host "🔍 Checking .env.local for Stripe configuration..." -ForegroundColor Cyan
Write-Host ""

$envFile = ".env.local"

if (-not (Test-Path $envFile)) {
    Write-Host "❌ .env.local does not exist!" -ForegroundColor Red
    Write-Host "   Creating new file..." -ForegroundColor Yellow
    "" | Out-File $envFile -Encoding UTF8
}

$content = Get-Content $envFile -Raw
$lines = Get-Content $envFile

# Check for Stripe variables
$hasPublishableKey = $content -match "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY"
$hasSecretKey = $content -match "STRIPE_SECRET_KEY"
$hasPriceId = $content -match "NEXT_PUBLIC_STRIPE_PRO_PRICE_ID"

Write-Host "Current Stripe Configuration:" -ForegroundColor Cyan
Write-Host "============================" -ForegroundColor Cyan
Write-Host ""

if ($hasPublishableKey) {
    $pubKeyLine = $lines | Where-Object { $_ -match "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY" }
    $pubKey = ($pubKeyLine -split "=")[1].Trim()
    if ($pubKey -match "pk_test_") {
        Write-Host "✅ Publishable Key: Test Mode ($($pubKey.Substring(0, 20))...)" -ForegroundColor Green
    } elseif ($pubKey -match "pk_live_") {
        Write-Host "⚠️  Publishable Key: LIVE MODE ($($pubKey.Substring(0, 20))...)" -ForegroundColor Red
        Write-Host "   ⚠️  This is Live Mode! You need Test Mode (pk_test_...)" -ForegroundColor Yellow
    } else {
        Write-Host "⚠️  Publishable Key: Unknown format" -ForegroundColor Yellow
    }
} else {
    Write-Host "❌ NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: NOT SET" -ForegroundColor Red
}

if ($hasSecretKey) {
    $secretKeyLine = $lines | Where-Object { $_ -match "^STRIPE_SECRET_KEY" }
    $secretKey = ($secretKeyLine -split "=")[1].Trim()
    if ($secretKey -match "sk_test_") {
        Write-Host "✅ Secret Key: Test Mode ($($secretKey.Substring(0, 20))...)" -ForegroundColor Green
    } elseif ($secretKey -match "sk_live_") {
        Write-Host "⚠️  Secret Key: LIVE MODE ($($secretKey.Substring(0, 20))...)" -ForegroundColor Red
        Write-Host "   ⚠️  This is Live Mode! You need Test Mode (sk_test_...)" -ForegroundColor Yellow
    } else {
        Write-Host "⚠️  Secret Key: Unknown format" -ForegroundColor Yellow
    }
} else {
    Write-Host "❌ STRIPE_SECRET_KEY: NOT SET" -ForegroundColor Red
}

if ($hasPriceId) {
    $priceIdLine = $lines | Where-Object { $_ -match "NEXT_PUBLIC_STRIPE_PRO_PRICE_ID" }
    $priceId = ($priceIdLine -split "=")[1].Trim()
    if ($priceId -eq "price_1SdxpyHe5rsxCfoQfYrXQSOu") {
        Write-Host "❌ Price ID: $priceId" -ForegroundColor Red
        Write-Host "   ⚠️  THIS IS THE LIVE MODE PRICE ID CAUSING YOUR ERROR!" -ForegroundColor Red
        Write-Host "   ⚠️  You need to create a Test Mode product and use that Price ID" -ForegroundColor Yellow
    } elseif ($priceId -match "price_") {
        Write-Host "✅ Price ID: $priceId" -ForegroundColor Green
        Write-Host "   (Make sure this is from Test Mode, not Live Mode)" -ForegroundColor Gray
    } else {
        Write-Host "⚠️  Price ID: Unknown format" -ForegroundColor Yellow
    }
} else {
    Write-Host "❌ NEXT_PUBLIC_STRIPE_PRO_PRICE_ID: NOT SET" -ForegroundColor Red
}

Write-Host ""
Write-Host "🔧 What You Need To Do:" -ForegroundColor Cyan
Write-Host "=======================" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. Create Test Mode Product in Stripe:" -ForegroundColor White
Write-Host "   → Go to: https://dashboard.stripe.com/test/products" -ForegroundColor Gray
Write-Host "   → Make sure toggle says 'Test mode' (top-right)" -ForegroundColor Gray
Write-Host "   → Create product: CompLens Pro, $99/year" -ForegroundColor Gray
Write-Host "   → Copy the Test Mode Price ID" -ForegroundColor Gray
Write-Host ""
Write-Host "2. Get Test Mode API Keys:" -ForegroundColor White
Write-Host "   → Go to: https://dashboard.stripe.com/test/apikeys" -ForegroundColor Gray
Write-Host "   → Copy pk_test_... and sk_test_... keys" -ForegroundColor Gray
Write-Host ""
Write-Host "3. Update .env.local:" -ForegroundColor White
Write-Host "   → Replace the Live Mode Price ID with your Test Mode Price ID" -ForegroundColor Gray
Write-Host "   → Make sure keys start with pk_test_ and sk_test_" -ForegroundColor Gray
Write-Host ""
Write-Host "4. Restart dev server:" -ForegroundColor White
Write-Host "   → Stop the server (Ctrl+C)" -ForegroundColor Gray
Write-Host "   → Run: npm run dev" -ForegroundColor Gray
Write-Host ""
Write-Host "📚 See STRIPE_TEST_MODE_SETUP_NOW.md for detailed instructions" -ForegroundColor Cyan

