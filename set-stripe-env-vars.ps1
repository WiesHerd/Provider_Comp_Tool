# Script to set Stripe environment variables for Firebase Functions
# Reads values from .env.local (so you can switch test <-> live in one place)
#
# Prereqs:
# - Google Cloud SDK installed (`gcloud`)
# - Authenticated: `gcloud auth login`
# - Correct project access for complens-88a4f
#
# Usage:
#   cd "C:\Users\wherd\Python Projects\Provider_Comp_Tool"
#   .\set-stripe-env-vars.ps1

$projectId = "complens-88a4f"
$region = "us-central1"
$envFile = ".env.local"

if (-not (Test-Path $envFile)) {
  Write-Host "ERROR: .env.local not found. Run setup script first." -ForegroundColor Red
  exit 1
}

# Parse .env.local
$raw = Get-Content $envFile
$envMap = @{}
foreach ($line in $raw) {
  $trim = $line.Trim()
  if (-not $trim -or $trim.StartsWith("#")) { continue }
  $idx = $trim.IndexOf("=")
  if ($idx -lt 1) { continue }
  $k = $trim.Substring(0, $idx).Trim()
  $v = $trim.Substring($idx + 1).Trim()
  $envMap[$k] = $v
}

$required = @("STRIPE_SECRET_KEY", "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY", "NEXT_PUBLIC_STRIPE_PRO_PRICE_ID")
foreach ($k in $required) {
  if (-not $envMap.ContainsKey($k) -or -not $envMap[$k]) {
    Write-Host "ERROR: Missing $k in .env.local" -ForegroundColor Red
    exit 2
  }
}

$mode = if ($envMap["STRIPE_SECRET_KEY"].StartsWith("sk_live_")) { "LIVE" } elseif ($envMap["STRIPE_SECRET_KEY"].StartsWith("sk_test_")) { "TEST" } else { "UNKNOWN" }
Write-Host "Setting Stripe env vars for Firebase Functions (mode: $mode)..." -ForegroundColor Cyan

$envVars = @{
  "STRIPE_SECRET_KEY" = $envMap["STRIPE_SECRET_KEY"]
  "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY" = $envMap["NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY"]
  "NEXT_PUBLIC_STRIPE_PRO_PRICE_ID" = $envMap["NEXT_PUBLIC_STRIPE_PRO_PRICE_ID"]
}

if ($envMap.ContainsKey("STRIPE_WEBHOOK_SECRET") -and $envMap["STRIPE_WEBHOOK_SECRET"]) {
  $envVars["STRIPE_WEBHOOK_SECRET"] = $envMap["STRIPE_WEBHOOK_SECRET"]
}

$functions = @("createCheckoutSession", "createDonationSession", "createBillingPortalSession", "stripeWebhook")

Write-Host "" 
Write-Host "Building Firebase Functions locally (tsc)..." -ForegroundColor Cyan
npm --prefix functions run build | Out-Host

foreach ($func in $functions) {
  Write-Host ""
  Write-Host "Updating $func..." -ForegroundColor Yellow

  # gcloud's --update-env-vars parsing is fragile with commas and special chars.
  # Use a temp YAML env vars file instead.
  $tmp = Join-Path $env:TEMP ("stripe-env-vars-{0}.yaml" -f $func)
  $yamlLines = @()
  foreach ($k in $envVars.Keys) {
    $v = $envVars[$k]
    # YAML single-quote escaping: ' -> ''
    $escaped = $v -replace "'", "''"
    $yamlLines += "${k}: '$escaped'"
  }
  Set-Content -Path $tmp -Value ($yamlLines -join "`n") -Encoding UTF8

  # gcloud deploy needs a JS entrypoint available at deploy time.
  # Create a temporary deploy directory containing package.json and the compiled lib/ output.
  $deployDir = Join-Path $env:TEMP ("gcf-deploy-{0}" -f $func)
  if (Test-Path $deployDir) { Remove-Item -Recurse -Force $deployDir }
  New-Item -ItemType Directory -Path $deployDir | Out-Null
  Copy-Item -Path "functions\package.json" -Destination (Join-Path $deployDir "package.json")
  if (Test-Path "functions\package-lock.json") {
    Copy-Item -Path "functions\package-lock.json" -Destination (Join-Path $deployDir "package-lock.json")
  }
  Copy-Item -Recurse -Force -Path "functions\lib" -Destination (Join-Path $deployDir "lib")

  $result = gcloud functions deploy $func `
    --region=$region `
    --env-vars-file $tmp `
    --project=$projectId `
    --runtime=nodejs20 `
    --source=$deployDir `
    --entry-point=$func `
    --trigger-http `
    --allow-unauthenticated `
    2>&1

  Remove-Item -Force $tmp -ErrorAction SilentlyContinue
  Remove-Item -Recurse -Force $deployDir -ErrorAction SilentlyContinue

  if ($LASTEXITCODE -eq 0) {
    Write-Host "  OK: $func updated" -ForegroundColor Green
  } else {
    Write-Host "  ERROR: Failed to update $func" -ForegroundColor Red
    Write-Host "  $result" -ForegroundColor Red
    exit 3
  }
}

Write-Host ""
Write-Host "Done. Firebase Functions now use the Stripe values from .env.local." -ForegroundColor Green
