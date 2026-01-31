# Update Firebase Functions environment variables using Google Cloud Functions API
# This avoids rebuilding the functions

$projectId = "complens-88a4f"
$region = "us-central1

# Get access token
$accessToken = gcloud auth print-access-token

# Environment variables to set
# Replace placeholders with your keys from Stripe Dashboard → API Keys
$envVars = @{
    "STRIPE_SECRET_KEY" = "sk_test_YOUR_SECRET_KEY_HERE"
    "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY" = "pk_test_YOUR_PUBLISHABLE_KEY_HERE"
    "NEXT_PUBLIC_STRIPE_PRO_PRICE_ID" = "price_YOUR_PRICE_ID_HERE"
}

# Functions to update
$functions = @("createCheckoutSession", "createDonationSession", "stripeWebhook")

Write-Host "Updating environment variables via API..." -ForegroundColor Cyan
Write-Host ""

foreach ($func in $functions) {
    Write-Host "Updating $func..." -ForegroundColor Yellow
    
    $functionName = "projects/$projectId/locations/$region/functions/$func"
    $url = "https://cloudfunctions.googleapis.com/v1/$functionName"
    
    # Get current function configuration
    $headers = @{
        "Authorization" = "Bearer $accessToken"
        "Content-Type" = "application/json"
    }
    
    try {
        $currentFunc = Invoke-RestMethod -Uri $url -Method Get -Headers $headers
        
        # Update environment variables
        $currentFunc.serviceConfig.environmentVariables = $envVars
        
        # Prepare update mask - only update environment variables
        $updateMask = "serviceConfig.environmentVariables"
        
        # PATCH request to update only environment variables
        $patchUrl = "$url?updateMask=$updateMask"
        $body = @{
            serviceConfig = @{
                environmentVariables = $envVars
            }
        } | ConvertTo-Json -Depth 10
        
        $result = Invoke-RestMethod -Uri $patchUrl -Method PATCH -Headers $headers -Body $body -ContentType "application/json"
        
        Write-Host "  ✅ $func updated successfully!" -ForegroundColor Green
    }
    catch {
        Write-Host "  ❌ Failed to update $func" -ForegroundColor Red
        Write-Host "  Error: $($_.Exception.Message)" -ForegroundColor Red
        if ($_.ErrorDetails.Message) {
            Write-Host "  Details: $($_.ErrorDetails.Message)" -ForegroundColor Red
        }
    }
    
    Write-Host ""
}

Write-Host "🎉 Environment variable update complete!" -ForegroundColor Green
