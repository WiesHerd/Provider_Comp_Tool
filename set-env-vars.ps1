# Script to set environment variables for Firebase Functions
# This uses the Google Cloud REST API

$projectId = "complens-88a4f"
$region = "us-central1"

# Replace with your keys from Stripe Dashboard → API Keys and Products
$envVars = @{
    "STRIPE_SECRET_KEY" = "sk_test_YOUR_SECRET_KEY_HERE"
    "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY" = "pk_test_YOUR_PUBLISHABLE_KEY_HERE"
    "NEXT_PUBLIC_STRIPE_PRO_PRICE_ID" = "price_YOUR_PRICE_ID_HERE"
}

# Functions to update
$functions = @("createCheckoutSession", "createDonationSession", "stripeWebhook")

Write-Host "This script requires Google Cloud CLI (gcloud) to be installed." -ForegroundColor Yellow
Write-Host "`nTo install gcloud CLI:" -ForegroundColor Cyan
Write-Host "1. Download from: https://cloud.google.com/sdk/docs/install" -ForegroundColor White
Write-Host "2. Or use: winget install Google.CloudSDK" -ForegroundColor White
Write-Host "`nAfter installing, run this script again." -ForegroundColor Yellow

Write-Host "`nAlternatively, you can set these manually in Google Cloud Console:" -ForegroundColor Cyan
Write-Host "https://console.cloud.google.com/functions/list?project=$projectId" -ForegroundColor White

Write-Host "`nFor each function, add these environment variables:" -ForegroundColor Cyan
foreach ($key in $envVars.Keys) {
    Write-Host "  $key = $($envVars[$key])" -ForegroundColor Gray
}




