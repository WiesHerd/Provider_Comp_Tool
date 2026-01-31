# Script to help set Stripe environment variables via Google Cloud Console
# Since API doesn't work for 1st gen functions, this opens the console with instructions

$projectId = "complens-88a4f"
$region = "us-central1"

# Replace placeholders with your keys from Stripe Dashboard → API Keys
$envVars = @{
    "STRIPE_SECRET_KEY" = "sk_test_YOUR_SECRET_KEY_HERE"
    "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY" = "pk_test_YOUR_PUBLISHABLE_KEY_HERE"
    "NEXT_PUBLIC_STRIPE_PRO_PRICE_ID" = "price_YOUR_PRICE_ID_HERE"
}

$functions = @("createDonationSession", "stripeWebhook")

Write-Host "`n=== Setting Stripe Environment Variables ===" -ForegroundColor Cyan
Write-Host "`nFor 1st gen functions, environment variables must be set via Google Cloud Console.`n" -ForegroundColor Yellow

foreach ($func in $functions) {
    Write-Host "Setting variables for: $func" -ForegroundColor Yellow
    $url = "https://console.cloud.google.com/functions/edit/$region/$func?project=$projectId"
    Start-Process $url
    
    Write-Host "`nIn the browser that just opened:" -ForegroundColor Cyan
    Write-Host "1. Scroll to 'Runtime, build, connections and security settings'" -ForegroundColor White
    Write-Host "2. Expand it and find 'Runtime environment variables'" -ForegroundColor White
    Write-Host "3. Click 'ADD VARIABLE' and add these:" -ForegroundColor White
    Write-Host ""
    foreach ($key in $envVars.Keys) {
        Write-Host "   Name:  $key" -ForegroundColor Green
        Write-Host "   Value: $($envVars[$key])" -ForegroundColor Gray
        Write-Host ""
    }
    Write-Host "4. Click 'DEPLOY' (takes 1-2 minutes)" -ForegroundColor White
    Write-Host ""
    Write-Host "Press Enter after you've set the variables for $func..." -ForegroundColor Yellow
    Read-Host
}

Write-Host "`n✅ All done! Stripe should now work." -ForegroundColor Green
