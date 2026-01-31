# Simple Firebase Deployment Script
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Firebase Deployment" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Handle API route
Write-Host "[1/4] Handling API route..." -ForegroundColor Yellow
if (Test-Path "app\api") {
    if (Test-Path "app\api.backup") {
        Remove-Item -Recurse -Force "app\api.backup"
    }
    Move-Item -Path "app\api" -Destination "app\api.backup" -Force
    Write-Host "  ✓ API route moved" -ForegroundColor Green
}

# Step 2: Clean
Write-Host "[2/4] Cleaning..." -ForegroundColor Yellow
Remove-Item -Recurse -Force .next -ErrorAction SilentlyContinue
Remove-Item -Recurse -Force out -ErrorAction SilentlyContinue
Write-Host "  ✓ Cleaned" -ForegroundColor Green

# Step 3: Build
Write-Host "[3/4] Building for Firebase..." -ForegroundColor Yellow
Write-Host "  This may take 2-3 minutes..." -ForegroundColor Gray
$env:FIREBASE_DEPLOY = "true"
$buildResult = npm run build:firebase 2>&1

if ($LASTEXITCODE -ne 0) {
    Write-Host "  ✗ Build failed!" -ForegroundColor Red
    Write-Host $buildResult -ForegroundColor Red
    exit 1
}

if (-not (Test-Path "out\index.html")) {
    Write-Host "  ✗ Build failed - no index.html" -ForegroundColor Red
    exit 1
}

$fileCount = (Get-ChildItem "out" -Recurse -File | Measure-Object).Count
Write-Host "  ✓ Build complete: $fileCount files" -ForegroundColor Green

# Step 4: Deploy
Write-Host "[4/4] Deploying to Firebase..." -ForegroundColor Yellow
firebase use complens-88a4f
$deployResult = firebase deploy --only hosting 2>&1

if ($LASTEXITCODE -ne 0) {
    Write-Host "  ✗ Deployment failed!" -ForegroundColor Red
    Write-Host $deployResult -ForegroundColor Red
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










