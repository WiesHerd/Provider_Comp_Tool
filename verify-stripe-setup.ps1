# Script to verify Stripe environment variable setup
Write-Host "🔍 Verifying Stripe Configuration..." -ForegroundColor Cyan
Write-Host ""

# Check .env.local file
$envFile = ".env.local"
if (Test-Path $envFile) {
    Write-Host "✅ .env.local file exists" -ForegroundColor Green
    $envContent = Get-Content $envFile
    
    # Check for Stripe variables
    $publishableKey = $envContent | Select-String -Pattern "^NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="
    $secretKey = $envContent | Select-String -Pattern "^STRIPE_SECRET_KEY="
    $priceId = $envContent | Select-String -Pattern "^NEXT_PUBLIC_STRIPE_PRO_PRICE_ID="
    
    if ($publishableKey) {
        $pkValue = ($publishableKey -split "=")[1].Trim()
        if ($pkValue -match "^pk_test_") {
            Write-Host "✅ Publishable Key: Test Mode detected" -ForegroundColor Green
            Write-Host "   Key: $($pkValue.Substring(0, 20))..." -ForegroundColor Gray
        } elseif ($pkValue -match "^pk_live_") {
            Write-Host "⚠️  Publishable Key: LIVE MODE detected!" -ForegroundColor Yellow
            Write-Host "   You're using Live Mode keys. Make sure your Price ID is also from Live Mode." -ForegroundColor Yellow
        } else {
            Write-Host "❌ Publishable Key: Invalid format" -ForegroundColor Red
        }
    } else {
        Write-Host "❌ NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY not found in .env.local" -ForegroundColor Red
    }
    
    if ($secretKey) {
        $skValue = ($secretKey -split "=")[1].Trim()
        if ($skValue -match "^sk_test_") {
            Write-Host "✅ Secret Key: Test Mode detected" -ForegroundColor Green
            Write-Host "   Key: $($skValue.Substring(0, 20))..." -ForegroundColor Gray
        } elseif ($skValue -match "^sk_live_") {
            Write-Host "⚠️  Secret Key: LIVE MODE detected!" -ForegroundColor Yellow
        } else {
            Write-Host "❌ Secret Key: Invalid format" -ForegroundColor Red
        }
    } else {
        Write-Host "❌ STRIPE_SECRET_KEY not found in .env.local" -ForegroundColor Red
    }
    
    if ($priceId) {
        $pidValue = ($priceId -split "=")[1].Trim()
        if ($pidValue -eq "price_1SdxpyHe5rsxCfoQfYrXQSOu") {
            Write-Host "❌ Price ID: Using OLD LIVE MODE Price ID!" -ForegroundColor Red
            Write-Host "   Current: $pidValue" -ForegroundColor Red
            Write-Host "   This is the Live Mode Price ID causing your error!" -ForegroundColor Red
            Write-Host ""
            Write-Host "🔧 FIX NEEDED:" -ForegroundColor Yellow
            Write-Host "   1. Create a Test Mode product in Stripe Dashboard" -ForegroundColor White
            Write-Host "   2. Get the Test Mode Price ID (starts with price_...)" -ForegroundColor White
            Write-Host "   3. Update NEXT_PUBLIC_STRIPE_PRO_PRICE_ID in .env.local" -ForegroundColor White
        } elseif ($pidValue -match "^price_") {
            Write-Host "✅ Price ID: Found ($pidValue)" -ForegroundColor Green
            Write-Host "   Make sure this is a TEST MODE Price ID if using test keys!" -ForegroundColor Yellow
        } else {
            Write-Host "❌ Price ID: Invalid format" -ForegroundColor Red
        }
    } else {
        Write-Host "❌ NEXT_PUBLIC_STRIPE_PRO_PRICE_ID not found in .env.local" -ForegroundColor Red
    }
    
    # Check for mode mismatch
    if ($publishableKey -and $secretKey -and $priceId) {
        $pkValue = ($publishableKey -split "=")[1].Trim()
        $skValue = ($secretKey -split "=")[1].Trim()
        $pidValue = ($priceId -split "=")[1].Trim()
        
        $isTestMode = ($pkValue -match "^pk_test_") -and ($skValue -match "^sk_test_")
        
        if ($isTestMode -and $pidValue -eq "price_1SdxpyHe5rsxCfoQfYrXQSOu") {
            Write-Host ""
            Write-Host "🚨 MODE MISMATCH DETECTED!" -ForegroundColor Red
            Write-Host "   You're using Test Mode keys with a Live Mode Price ID!" -ForegroundColor Red
            Write-Host ""
            Write-Host "📋 Quick Fix:" -ForegroundColor Cyan
            Write-Host "   1. Go to: https://dashboard.stripe.com/test/products" -ForegroundColor White
            Write-Host "   2. Create a new product in TEST MODE" -ForegroundColor White
            Write-Host "   3. Copy the new Test Mode Price ID" -ForegroundColor White
            Write-Host "   4. Update .env.local with the new Price ID" -ForegroundColor White
            Write-Host "   5. Restart your dev server" -ForegroundColor White
        }
    }
} else {
    Write-Host "❌ .env.local file not found!" -ForegroundColor Red
    Write-Host ""
    Write-Host "📋 Create .env.local with:" -ForegroundColor Cyan
    Write-Host "   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_..." -ForegroundColor White
    Write-Host "   STRIPE_SECRET_KEY=sk_test_..." -ForegroundColor White
    Write-Host "   NEXT_PUBLIC_STRIPE_PRO_PRICE_ID=price_..." -ForegroundColor White
    Write-Host ""
    Write-Host "   Or run: .\setup-stripe-test-mode.ps1" -ForegroundColor Cyan
}

Write-Host ""
Write-Host "📚 For detailed setup instructions, see:" -ForegroundColor Cyan
Write-Host "   - STRIPE_TEST_MODE_SETUP_NOW.md" -ForegroundColor White
Write-Host "   - QUICK_FIX_STRIPE_MODE_MISMATCH.md" -ForegroundColor White

