# 🔐 Authenticate and Set Environment Variables

## Step 1: Authenticate with Google Cloud

Open a **new PowerShell window** and run:

```powershell
gcloud auth login
```

This will open your browser. Sign in with your Google account that has access to the `complens-88a4f` project.

## Step 2: Set Environment Variables

After authentication, run this script to set all environment variables:

```powershell
# Set project
gcloud config set project complens-88a4f

# Replace with your keys from Stripe Dashboard → API Keys and Products
$envVars = @{
    "STRIPE_SECRET_KEY" = "sk_test_YOUR_SECRET_KEY_HERE"
    "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY" = "pk_test_YOUR_PUBLISHABLE_KEY_HERE"
    "NEXT_PUBLIC_STRIPE_PRO_PRICE_ID" = "price_YOUR_PRICE_ID_HERE"
}

# Functions to update
$functions = @("createCheckoutSession", "createDonationSession", "stripeWebhook")

# Update each function
foreach ($func in $functions) {
    Write-Host "Updating $func..." -ForegroundColor Cyan
    
    $envVarsString = ($envVars.GetEnumerator() | ForEach-Object { "$($_.Key)=$($_.Value)" }) -join ","
    
    gcloud functions deploy $func `
        --region=us-central1 `
        --update-env-vars $envVarsString `
        --project=complens-88a4f `
        --gen2 `
        --runtime=nodejs20 `
        --source=functions `
        --entry-point=$func `
        --trigger-http `
        --allow-unauthenticated
    
    Write-Host "✅ $func updated!" -ForegroundColor Green
}

Write-Host "`n🎉 All environment variables set!" -ForegroundColor Green
```

## Alternative: Manual Setup (Easier)

If the CLI approach is complex, you can set them manually in Google Cloud Console:

1. Go to: https://console.cloud.google.com/functions/list?project=complens-88a4f
2. Click on each function (`createCheckoutSession`, `createDonationSession`, `stripeWebhook`)
3. Click "EDIT"
4. Scroll to "Runtime environment variables"
5. Add the 3 variables
6. Click "DEPLOY"
