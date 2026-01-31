# Updates STRIPE_WEBHOOK_SECRET in .env.local (adds it if missing)
#
# Usage:
#   cd "C:\Users\wherd\Python Projects\Provider_Comp_Tool"
#   .\update-webhook-secret.ps1 -Secrets "whsec_a,whsec_b"

param(
  [Parameter(Mandatory = $true)]
  [string]$Secrets
)

$path = ".env.local"
if (-not (Test-Path $path)) {
  Write-Host "ERROR: .env.local not found in current directory." -ForegroundColor Red
  exit 1
}

$key = "STRIPE_WEBHOOK_SECRET"
$pattern = ("^{0}=" -f [regex]::Escape($key))

$lines = Get-Content $path
$found = $false
for ($i = 0; $i -lt $lines.Length; $i++) {
  if ($lines[$i] -match $pattern) {
    $lines[$i] = "$key=$Secrets"
    $found = $true
    break
  }
}

if (-not $found) {
  $lines += ""
  $lines += "$key=$Secrets"
}

Set-Content -Path $path -Value $lines -Encoding UTF8
Write-Host "Updated STRIPE_WEBHOOK_SECRET in .env.local (value not printed)." -ForegroundColor Green



