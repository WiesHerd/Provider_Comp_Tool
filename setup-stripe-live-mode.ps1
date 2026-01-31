# PowerShell script to configure Stripe LIVE mode keys in .env.local
# Prompts for pk_live / sk_live / price_ / whsec_ and writes them into .env.local
#
# Usage:
#   cd "C:\Users\wherd\Python Projects\Provider_Comp_Tool"
#   .\setup-stripe-live-mode.ps1

Write-Host "Stripe LIVE mode setup (.env.local)" -ForegroundColor Cyan
Write-Host ""

$envFile = ".env.local"
if (-not (Test-Path $envFile)) {
  Write-Host "ERROR: .env.local not found. Create it first (you already have one)." -ForegroundColor Red
  exit 1
}

Write-Host "Paste values from Stripe LIVE mode:" -ForegroundColor Yellow
Write-Host " - Developers -> API keys: pk_live_..., sk_live_..." -ForegroundColor Yellow
Write-Host " - Product catalog -> your product -> price: price_..." -ForegroundColor Yellow
Write-Host " - Developers -> Webhooks (LIVE): signing secret whsec_..." -ForegroundColor Yellow
Write-Host ""

$pk = Read-Host "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY (pk_live_...)"
$sk = Read-Host "STRIPE_SECRET_KEY (sk_live_...)"
$price = Read-Host "NEXT_PUBLIC_STRIPE_PRO_PRICE_ID (price_...)"
$whsec = Read-Host "STRIPE_WEBHOOK_SECRET (whsec_...) (optional - press Enter to skip)"

function Assert-Prefix([string]$value, [string]$prefix, [string]$name) {
  if (-not $value) { throw "$name is required" }
  if (-not $value.StartsWith($prefix)) {
    throw "$name must start with $prefix (did you copy from the correct Stripe mode?)"
  }
}

try {
  Assert-Prefix $pk "pk_live_" "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY"
  Assert-Prefix $sk "sk_live_" "STRIPE_SECRET_KEY"
  Assert-Prefix $price "price_" "NEXT_PUBLIC_STRIPE_PRO_PRICE_ID"
  if ($whsec) { Assert-Prefix $whsec "whsec_" "STRIPE_WEBHOOK_SECRET" }
} catch {
  Write-Host "ERROR: $($_.Exception.Message)" -ForegroundColor Red
  exit 2
}

# Read existing lines and replace/add Stripe vars
$lines = Get-Content $envFile

function Upsert-Line([string[]]$arr, [string]$key, [string]$value) {
  $pattern = "^{0}=" -f [regex]::Escape($key)
  $idx = -1
  for ($i=0; $i -lt $arr.Length; $i++) {
    if ($arr[$i] -match $pattern) { $idx = $i; break }
  }
  if ($idx -ge 0) {
    $arr[$idx] = "$key=$value"
  } else {
    # append near end
    $arr += "$key=$value"
  }
  return ,$arr
}

$lines = Upsert-Line $lines "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY" $pk
$lines = Upsert-Line $lines "STRIPE_SECRET_KEY" $sk
$lines = Upsert-Line $lines "NEXT_PUBLIC_STRIPE_PRO_PRICE_ID" $price
if ($whsec) {
  $lines = Upsert-Line $lines "STRIPE_WEBHOOK_SECRET" $whsec
}

Set-Content -Path $envFile -Value $lines -Encoding UTF8

Write-Host ""
Write-Host "✅ Updated .env.local with LIVE Stripe values." -ForegroundColor Green
Write-Host "Next: restart dev server (env changes require restart):" -ForegroundColor Cyan
Write-Host "  npm run dev" -ForegroundColor White



