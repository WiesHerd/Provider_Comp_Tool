# Fixed Deployment Script - Direct Approach
$ErrorActionPreference = "Stop"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Firebase Deployment - FIXED VERSION" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Move API route
Write-Host "[1/5] Moving API route..." -ForegroundColor Yellow
if (Test-Path "app\api") {
    if (Test-Path "app\api.backup") {
        Remove-Item -Recurse -Force "app\api.backup"
    }
    Move-Item -Path "app\api" -Destination "app\api.backup" -Force
    Write-Host "  ✓ API route moved" -ForegroundColor Green
} else {
    Write-Host "  ✓ API route already moved" -ForegroundColor Gray
}

# Step 2: Clean
Write-Host "[2/5] Cleaning..." -ForegroundColor Yellow
Remove-Item -Recurse -Force .next -ErrorAction SilentlyContinue
Remove-Item -Recurse -Force out -ErrorAction SilentlyContinue
Write-Host "  ✓ Cleaned" -ForegroundColor Green

# Step 3: Set environment variable and build
Write-Host "[3/5] Building (this takes 2-3 minutes)..." -ForegroundColor Yellow
$env:FIREBASE_DEPLOY = "true"
$buildOutput = & npm run build 2>&1 | Out-String

if ($LASTEXITCODE -ne 0) {
    Write-Host "  ✗ BUILD FAILED!" -ForegroundColor Red
    Write-Host $buildOutput -ForegroundColor Red
    exit 1
}

# Step 4: Verify build
Write-Host "[4/5] Verifying build..." -ForegroundColor Yellow
if (-not (Test-Path "out\index.html")) {
    Write-Host "  ✗ Build failed - no index.html" -ForegroundColor Red
    Write-Host "  Build output:" -ForegroundColor Yellow
    Write-Host $buildOutput -ForegroundColor Gray
    exit 1
}

$fileCount = (Get-ChildItem "out" -Recurse -File | Measure-Object).Count
Write-Host "  ✓ Build complete: $fileCount files" -ForegroundColor Green

# Step 5: Deploy
Write-Host "[5/5] Deploying to Firebase..." -ForegroundColor Yellow
firebase use complens-88a4f
$deployOutput = firebase deploy --only hosting 2>&1 | Out-String

if ($LASTEXITCODE -ne 0) {
    Write-Host "  ✗ DEPLOYMENT FAILED!" -ForegroundColor Red
    Write-Host $deployOutput -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "  ✓ DEPLOYMENT SUCCESSFUL!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Your app is live at:" -ForegroundColor Cyan
Write-Host "  https://complens-88a4f.web.app" -ForegroundColor White
Write-Host "  https://complens-88a4f.firebaseapp.com" -ForegroundColor White
Write-Host ""

# Restore API route
if (Test-Path "app\api.backup") {
    if (Test-Path "app\api") {
        Remove-Item -Recurse -Force "app\api"
    }
    Move-Item -Path "app\api.backup" -Destination "app\api" -Force
    Write-Host "✓ API route restored" -ForegroundColor Gray
}










