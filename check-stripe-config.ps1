# check-stripe-config.ps1
# Simple ASCII-only checker for Stripe env vars in .env.local

$envFile = ".env.local"

Write-Host "Checking Stripe configuration in .env.local..." -ForegroundColor Cyan

if (-not (Test-Path $envFile)) {
  Write-Host "ERROR: .env.local not found in current directory." -ForegroundColor Red
  Write-Host "Run this from the project root, or create .env.local." -ForegroundColor Yellow
  exit 1
}

$envContent = Get-Content $envFile

function Get-EnvValue([string]$name) {
  $match = $envContent | Select-String -Pattern ("^{0}=(.+)$" -f [regex]::Escape($name)) | Select-Object -First 1
  if ($null -eq $match) { return "" }
  return $match.Matches.Groups[1].Value.Trim()
}

$publishableKey = Get-EnvValue "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY"
$secretKey = Get-EnvValue "STRIPE_SECRET_KEY"
$priceId = Get-EnvValue "NEXT_PUBLIC_STRIPE_PRO_PRICE_ID"

Write-Host ""
Write-Host "Current values (redacted):" -ForegroundColor Yellow
if ($publishableKey) {
  Write-Host ("- NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: {0}..." -f $publishableKey.Substring(0, [Math]::Min(12, $publishableKey.Length)))
} else {
  Write-Host "- NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: (missing)" -ForegroundColor Red
}

if ($secretKey) {
  Write-Host ("- STRIPE_SECRET_KEY: {0}..." -f $secretKey.Substring(0, [Math]::Min(12, $secretKey.Length)))
} else {
  Write-Host "- STRIPE_SECRET_KEY: (missing)" -ForegroundColor Red
}

if ($priceId) {
  Write-Host ("- NEXT_PUBLIC_STRIPE_PRO_PRICE_ID: {0}" -f $priceId)
} else {
  Write-Host "- NEXT_PUBLIC_STRIPE_PRO_PRICE_ID: (missing)" -ForegroundColor Red
}

Write-Host ""

$isTestKeys = ($publishableKey.StartsWith("pk_test_") -and $secretKey.StartsWith("sk_test_"))
$isLiveKeys = ($publishableKey.StartsWith("pk_live_") -and $secretKey.StartsWith("sk_live_"))

if (-not $publishableKey -or -not $secretKey -or -not $priceId) {
  Write-Host "Result: MISSING CONFIG. One or more Stripe variables are not set." -ForegroundColor Red
  exit 2
}

if (-not ($priceId.StartsWith("price_"))) {
  Write-Host "Result: INVALID PRICE ID FORMAT (should start with price_)." -ForegroundColor Red
  exit 3
}

if ($isTestKeys) {
  Write-Host "Keys: TEST mode (pk_test_/sk_test_)" -ForegroundColor Green
} elseif ($isLiveKeys) {
  Write-Host "Keys: LIVE mode (pk_live_/sk_live_)" -ForegroundColor Green
} else {
  Write-Host "Keys: MIXED/UNKNOWN (publishable/secret prefixes don't match)" -ForegroundColor Red
}

Write-Host ""
Write-Host "IMPORTANT: Stripe Price IDs exist separately in TEST vs LIVE." -ForegroundColor Yellow
Write-Host "If Upgrade to Pro fails but Donate works, your NEXT_PUBLIC_STRIPE_PRO_PRICE_ID is almost always the wrong mode or wrong price." -ForegroundColor Yellow

Write-Host ""
Write-Host "Next step:" -ForegroundColor Cyan
Write-Host "- Verify the price shown above exists in the SAME Stripe mode as your keys." -ForegroundColor Cyan
