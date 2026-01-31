# Firebase Deployment Script
Write-Host "🚀 Starting Firebase Deployment..." -ForegroundColor Cyan
Write-Host ""

# Step 1: Clean
Write-Host "📦 Step 1: Cleaning previous builds..." -ForegroundColor Yellow
if (Test-Path ".next") { 
    Remove-Item -Recurse -Force .next 
    Write-Host "  ✓ Removed .next directory" -ForegroundColor Gray
}
if (Test-Path "out") { 
    Remove-Item -Recurse -Force out 
    Write-Host "  ✓ Removed out directory" -ForegroundColor Gray
}

# Step 2: Temporarily move API routes (not supported in static export)
Write-Host ""
Write-Host "📦 Step 2: Handling API routes..." -ForegroundColor Yellow
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

try {
    # Step 3: Build
    Write-Host ""
    Write-Host "🔨 Step 3: Building for Firebase..." -ForegroundColor Yellow
    $env:FIREBASE_DEPLOY = "true"
    $buildResult = npm run build:firebase 2>&1

    if ($LASTEXITCODE -ne 0) {
        Write-Host ""
        Write-Host "❌ Build failed!" -ForegroundColor Red
        Write-Host $buildResult -ForegroundColor Red
        throw "Build failed"
    }

    # Step 4: Verify build
    Write-Host ""
    Write-Host "✅ Step 4: Verifying build..." -ForegroundColor Yellow
    if (-not (Test-Path "out\index.html")) {
        Write-Host "❌ Build failed! out/index.html not found." -ForegroundColor Red
        throw "Build verification failed"
    }

    $fileCount = (Get-ChildItem "out" -Recurse -File | Measure-Object).Count
    Write-Host "  ✓ Build successful! Found $fileCount files" -ForegroundColor Green
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

# Step 5: Deploy
Write-Host ""
Write-Host "🌐 Step 5: Deploying to Firebase Hosting..." -ForegroundColor Yellow
firebase deploy --only hosting

if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host "❌ Deployment failed!" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "✅ Deployment complete!" -ForegroundColor Green
Write-Host ""
Write-Host "📍 Your app is live at:" -ForegroundColor Cyan
Write-Host "   https://complens-88a4f.web.app" -ForegroundColor White
Write-Host "   https://complens-88a4f.firebaseapp.com" -ForegroundColor White
Write-Host ""

