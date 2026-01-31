# Full Autonomous Deployment Script
Write-Host "🚀 FULL AUTONOMOUS DEPLOYMENT - TAKING CONTROL" -ForegroundColor Cyan
Write-Host "=" * 60 -ForegroundColor Cyan
Write-Host ""

$projectPath = "c:\Users\wherd\Python Projects\Provider_Comp_Tool"
Set-Location $projectPath

# Step 1: Clean
Write-Host "📦 Step 1: Cleaning..." -ForegroundColor Yellow
Remove-Item -Recurse -Force .next -ErrorAction SilentlyContinue
Remove-Item -Recurse -Force out -ErrorAction SilentlyContinue
Write-Host "  ✓ Cleaned" -ForegroundColor Green
Write-Host ""

# Step 1.5: Temporarily move API routes (not supported in static export)
Write-Host "📦 Step 1.5: Handling API routes..." -ForegroundColor Yellow
$apiBackupPath = "app\api.backup"
$apiPath = "app\api"
$apiMoved = $false

if (Test-Path $apiPath) {
    if (Test-Path $apiBackupPath) {
        Remove-Item -Recurse -Force $apiBackupPath
    }
    Move-Item -Path $apiPath -Destination $apiBackupPath -Force
    $apiMoved = $true
    Write-Host "  ✓ Temporarily moved API routes" -ForegroundColor Gray
}
Write-Host ""

try {
    # Step 2: Build
    Write-Host "🔨 Step 2: Building for Firebase..." -ForegroundColor Yellow
    $env:FIREBASE_DEPLOY = "true"
    $buildOutput = npm run build:firebase 2>&1

    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ BUILD FAILED!" -ForegroundColor Red
        Write-Host $buildOutput -ForegroundColor Red
        throw "Build failed"
    }

    Write-Host ""

    # Step 3: Verify Build
    Write-Host "✅ Step 3: Verifying build..." -ForegroundColor Yellow
    if (-not (Test-Path "out\index.html")) {
        Write-Host "❌ Build verification failed - index.html not found" -ForegroundColor Red
        throw "Build verification failed"
    }

    $fileCount = (Get-ChildItem "out" -Recurse -File | Measure-Object).Count
    Write-Host "  ✓ Build verified: $fileCount files" -ForegroundColor Green
    Write-Host ""
} finally {
    # Restore API routes
    if ($apiMoved -and (Test-Path $apiBackupPath)) {
        if (Test-Path $apiPath) {
            Remove-Item -Recurse -Force $apiPath
        }
        Move-Item -Path $apiBackupPath -Destination $apiPath -Force
        Write-Host "  ✓ Restored API routes" -ForegroundColor Gray
    }
}

# Step 4: Verify Firebase Login
Write-Host "🔐 Step 4: Verifying Firebase login..." -ForegroundColor Yellow
$loginCheck = firebase login:list 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "  ⚠️  Not logged in - attempting login..." -ForegroundColor Yellow
    firebase login --no-localhost
}

# Step 5: Set Project
Write-Host "📁 Step 5: Setting Firebase project..." -ForegroundColor Yellow
firebase use complens-88a4f
Write-Host "  ✓ Project set" -ForegroundColor Green
Write-Host ""

# Step 6: Deploy
Write-Host "🌐 Step 6: Deploying to Firebase Hosting..." -ForegroundColor Yellow
Write-Host ""
firebase deploy --only hosting

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "=" * 60 -ForegroundColor Green
    Write-Host "✅ DEPLOYMENT COMPLETE!" -ForegroundColor Green
    Write-Host "=" * 60 -ForegroundColor Green
    Write-Host ""
    Write-Host "📍 Your app is live at:" -ForegroundColor Cyan
    Write-Host "   https://complens-88a4f.web.app" -ForegroundColor White
    Write-Host "   https://complens-88a4f.firebaseapp.com" -ForegroundColor White
    Write-Host ""
    Write-Host "🔍 Check deployment status:" -ForegroundColor Cyan
    Write-Host "   https://console.firebase.google.com/project/complens-88a4f/hosting" -ForegroundColor White
    Write-Host ""
} else {
    Write-Host ""
    Write-Host "❌ DEPLOYMENT FAILED!" -ForegroundColor Red
    Write-Host "   Check errors above" -ForegroundColor Yellow
    exit 1
}

