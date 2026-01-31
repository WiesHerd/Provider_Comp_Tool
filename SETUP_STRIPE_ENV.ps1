# PowerShell script to help set up Stripe environment variables
# This script creates/updates .env.local with a template

Write-Host "🔧 Stripe Test Mode Environment Setup" -ForegroundColor Cyan
Write-Host ""

# Check if .env.local exists
$envFile = ".env.local"
$envExample = ".env.example"

if (Test-Path $envFile) {
    Write-Host "⚠️  .env.local already exists!" -ForegroundColor Yellow
    Write-Host "   I'll create a backup and update it with the template." -ForegroundColor Yellow
    $backupFile = ".env.local.backup.$(Get-Date -Format 'yyyyMMdd-HHmmss')"
    Copy-Item $envFile $backupFile
    Write-Host "   Backup created: $backupFile" -ForegroundColor Green
    Write-Host ""
}

# Create .env.local from template
Write-Host "📝 Creating/updating .env.local with template..." -ForegroundColor Cyan

$template = @"
# Stripe Test Mode Configuration
# IMPORTANT: Replace the placeholder values below with your actual Test Mode values from Stripe Dashboard

# Stripe Test Mode Keys (100% Free!)
# Get these from: https://dashboard.stripe.com/test/apikeys
# Make sure you're in "Test mode" (toggle in top-right)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_YOUR_PUBLISHABLE_KEY_HERE
STRIPE_SECRET_KEY=sk_test_YOUR_SECRET_KEY_HERE

# Stripe Test Mode Price ID ($99/year)
# Create product at: https://dashboard.stripe.com/test/products
# Make sure you're in "Test mode" when creating the product
# Copy the Price ID (starts with price_...)
NEXT_PUBLIC_STRIPE_PRO_PRICE_ID=price_YOUR_TEST_PRICE_ID_HERE

# Optional: Webhook Secret (for local testing)
# Get this from: https://dashboard.stripe.com/test/webhooks
# STRIPE_WEBHOOK_SECRET=whsec_YOUR_WEBHOOK_SECRET_HERE
"@

Set-Content -Path $envFile -Value $template -Encoding UTF8

Write-Host "✅ .env.local created/updated!" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Next Steps:" -ForegroundColor Cyan
Write-Host "   1. Open .env.local in your editor" -ForegroundColor White
Write-Host "   2. Replace the placeholder values with your actual Test Mode values:" -ForegroundColor White
Write-Host "      - Get API keys from: https://dashboard.stripe.com/test/apikeys" -ForegroundColor Yellow
Write-Host "      - Create product and get Price ID from: https://dashboard.stripe.com/test/products" -ForegroundColor Yellow
Write-Host "   3. Save the file" -ForegroundColor White
Write-Host "   4. Restart your dev server: npm run dev" -ForegroundColor White
Write-Host ""
Write-Host "📖 For detailed instructions, see: STRIPE_TEST_MODE_SETUP_GUIDE.md" -ForegroundColor Cyan

