# Setup Feedback Function with Resend API Key
# This script helps you set up the Resend API key and deploy the feedback function

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Feedback Function Setup" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if Firebase CLI is installed
Write-Host "Checking Firebase CLI..." -ForegroundColor Yellow
try {
    $firebaseVersion = firebase --version
    Write-Host "✓ Firebase CLI found: $firebaseVersion" -ForegroundColor Green
} catch {
    Write-Host "✗ Firebase CLI not found. Please install it first:" -ForegroundColor Red
    Write-Host "  npm install -g firebase-tools" -ForegroundColor Yellow
    exit 1
}

Write-Host ""
Write-Host "To set up the feedback email function, you need a Resend API key." -ForegroundColor Yellow
Write-Host ""
Write-Host "If you don't have one:" -ForegroundColor Yellow
Write-Host "  1. Go to: https://resend.com/api-keys" -ForegroundColor Cyan
Write-Host "  2. Sign up or log in" -ForegroundColor Cyan
Write-Host "  3. Create a new API key" -ForegroundColor Cyan
Write-Host "  4. Copy the key (starts with re_)" -ForegroundColor Cyan
Write-Host ""

$apiKey = Read-Host "Enter your Resend API key (or press Enter to skip and set it manually later)"

if ($apiKey -and $apiKey -ne "") {
    Write-Host ""
    Write-Host "Setting Resend API key in Firebase Functions config..." -ForegroundColor Yellow
    
    try {
        firebase functions:config:set resend.api_key="$apiKey"
        Write-Host "✓ API key set successfully!" -ForegroundColor Green
    } catch {
        Write-Host "✗ Failed to set API key: $_" -ForegroundColor Red
        Write-Host ""
        Write-Host "You can set it manually with:" -ForegroundColor Yellow
        Write-Host "  firebase functions:config:set resend.api_key=`"YOUR_KEY`"" -ForegroundColor Cyan
        exit 1
    }
} else {
    Write-Host ""
    Write-Host "Skipping API key setup. You can set it later with:" -ForegroundColor Yellow
    Write-Host "  firebase functions:config:set resend.api_key=`"re_xxxxx`"" -ForegroundColor Cyan
    Write-Host ""
}

Write-Host ""
Write-Host "Building functions..." -ForegroundColor Yellow
Set-Location functions
npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Host "✗ Build failed!" -ForegroundColor Red
    Set-Location ..
    exit 1
}
Write-Host "✓ Build successful!" -ForegroundColor Green
Set-Location ..

Write-Host ""
Write-Host "Ready to deploy! Run this command to deploy:" -ForegroundColor Yellow
Write-Host "  firebase deploy --only functions" -ForegroundColor Cyan
Write-Host ""
Write-Host "Or deploy everything:" -ForegroundColor Yellow
Write-Host "  firebase deploy" -ForegroundColor Cyan
Write-Host ""

