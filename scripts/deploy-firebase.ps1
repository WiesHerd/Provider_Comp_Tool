# Firebase Deployment Script
# Enhanced with environment variable validation and error handling

param(
    [switch]$SkipValidation = $false
)

Write-Host "🚀 Starting Firebase Deployment..." -ForegroundColor Cyan

# Step 0: Validate Environment Variables (if not skipped)
if (-not $SkipValidation) {
    Write-Host "`n🔍 Validating environment variables..." -ForegroundColor Yellow
    
    $requiredVars = @(
        "NEXT_PUBLIC_FIREBASE_API_KEY",
        "NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN",
        "NEXT_PUBLIC_FIREBASE_PROJECT_ID",
        "NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET",
        "NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID",
        "NEXT_PUBLIC_FIREBASE_APP_ID"
    )
    
    $missingVars = @()
    foreach ($var in $requiredVars) {
        $value = [Environment]::GetEnvironmentVariable($var, "Process")
        if (-not $value) {
            # Try reading from .env.local file
            if (Test-Path ".env.local") {
                $lines = Get-Content ".env.local"
                foreach ($line in $lines) {
                    $line = $line.Trim()
                    if ($line.StartsWith("$var=")) {
                        $value = $line.Substring($var.Length + 1).Trim()
                        break
                    }
                }
            }
        }
        
        $isEmpty = [string]::IsNullOrWhiteSpace($value)
        $isPlaceholder = $value -eq "your_$($var.ToLower())_here"
        if (-not $value -or $isPlaceholder -or $isEmpty) {
            $missingVars += $var
        }
    }
    
    if ($missingVars.Count -gt 0) {
        Write-Host "`n❌ Missing or invalid environment variables:" -ForegroundColor Red
        foreach ($var in $missingVars) {
            Write-Host "   - $var" -ForegroundColor Yellow
        }
        Write-Host "`nPlease set these in .env.local file and restart your terminal." -ForegroundColor Yellow
        Write-Host "See scripts/get-firebase-config.md for instructions." -ForegroundColor Cyan
        exit 1
    }
    
    Write-Host "✅ All environment variables are set" -ForegroundColor Green
}

# Step 1: Check Firebase CLI
Write-Host "`n🔍 Checking Firebase CLI..." -ForegroundColor Yellow
$firebaseCheck = Get-Command firebase -ErrorAction SilentlyContinue
if (-not $firebaseCheck) {
    Write-Host "❌ Firebase CLI not found. Install with: npm install -g firebase-tools" -ForegroundColor Red
    exit 1
}

# Check if logged in
$firebaseUser = firebase projects:list 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Not logged in to Firebase. Run: firebase login" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Firebase CLI ready" -ForegroundColor Green

# Step 2: Clean previous builds
Write-Host "`n📦 Cleaning previous builds..." -ForegroundColor Yellow
if (Test-Path ".next") { 
    Remove-Item -Recurse -Force .next 
    Write-Host "   Removed .next directory" -ForegroundColor Gray
}
if (Test-Path "out") { 
    Remove-Item -Recurse -Force out 
    Write-Host "   Removed out directory" -ForegroundColor Gray
}

# Step 2.5: Temporarily move API routes (not supported in static export)
Write-Host "`n📦 Handling API routes..." -ForegroundColor Yellow
$apiBackupPath = "app\api.backup"
$apiPath = "app\api"
$apiMoved = $false

if (Test-Path $apiPath) {
    if (Test-Path $apiBackupPath) {
        Remove-Item -Recurse -Force $apiBackupPath
    }
    Move-Item -Path $apiPath -Destination $apiBackupPath -Force
    $apiMoved = $true
    Write-Host "   Temporarily moved API routes (not supported in static export)" -ForegroundColor Gray
}

try {
    # Step 3: Build for Firebase
    Write-Host "`n🔨 Building for Firebase..." -ForegroundColor Yellow
    $env:FIREBASE_DEPLOY = "true"

    # Load environment variables from .env.local if it exists
    if (Test-Path ".env.local") {
        Write-Host "   Loading environment variables from .env.local..." -ForegroundColor Gray
        Get-Content ".env.local" | ForEach-Object {
            $line = $_.Trim()
            if ($line -and -not $line.StartsWith('#')) {
                $parts = $line -split '=', 2
                if ($parts.Length -eq 2) {
                    $key = $parts[0].Trim()
                    $value = $parts[1].Trim()
                    if ($key -like 'NEXT_PUBLIC_*') {
                        [Environment]::SetEnvironmentVariable($key, $value, "Process")
                    }
                }
            }
        }
    }

    $buildOutput = npm run build:firebase 2>&1
    if ($LASTEXITCODE -ne 0) {
        Write-Host "`n❌ Build failed!" -ForegroundColor Red
        Write-Host $buildOutput -ForegroundColor Yellow
        throw "Build failed"
    }

    # Step 4: Check if build succeeded
    if (-not (Test-Path "out\index.html")) {
        Write-Host "`n❌ Build failed! out/index.html not found." -ForegroundColor Red
        Write-Host "Please check the build output above for errors." -ForegroundColor Yellow
        throw "Build verification failed"
    }

    $fileCount = (Get-ChildItem out -Recurse -File | Measure-Object | Select-Object -ExpandProperty Count)
    Write-Host "`n✅ Build successful!" -ForegroundColor Green
    Write-Host "   Found $fileCount files in out/ directory" -ForegroundColor Gray
} finally {
    # Restore API routes
    if ($apiMoved -and (Test-Path $apiBackupPath)) {
        if (Test-Path $apiPath) {
            Remove-Item -Recurse -Force $apiPath
        }
        Move-Item -Path $apiBackupPath -Destination $apiPath -Force
        Write-Host "   Restored API routes" -ForegroundColor Gray
    }
}

# Step 5: Deploy to Firebase
Write-Host "`n🌐 Deploying to Firebase Hosting..." -ForegroundColor Yellow
$deployOutput = firebase deploy --only hosting 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "`n❌ Deployment failed!" -ForegroundColor Red
    Write-Host $deployOutput -ForegroundColor Yellow
    exit 1
}

Write-Host "`n✅ Deployment complete!" -ForegroundColor Green
Write-Host "`n📍 Your app is live at:" -ForegroundColor Cyan
Write-Host "   https://complens-88a4f.web.app" -ForegroundColor White
Write-Host "   https://complens-88a4f.firebaseapp.com" -ForegroundColor White
Write-Host "`n💡 Next steps:" -ForegroundColor Cyan
Write-Host "   1. Visit the URLs above to test your app" -ForegroundColor Gray
Write-Host "   2. Test authentication (sign up, sign in, logout)" -ForegroundColor Gray
Write-Host "   3. Verify protected routes redirect to /auth when not logged in" -ForegroundColor Gray
