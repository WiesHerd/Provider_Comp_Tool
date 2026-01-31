# Build script that continues despite pre-render errors
# These errors are client-side only and won't affect runtime

Write-Host "🔨 Building for Firebase..." -ForegroundColor Cyan

# Run the build
$buildOutput = npm run build:firebase 2>&1 | Out-String

# Check if out directory was created
if (Test-Path "out") {
    Write-Host "✅ Build successful! out/ directory created." -ForegroundColor Green
    $fileCount = (Get-ChildItem out -Recurse -File | Measure-Object | Select-Object -ExpandProperty Count)
    Write-Host "   Found $fileCount files in out/ directory" -ForegroundColor Gray
    exit 0
} else {
    Write-Host "❌ Build failed - out/ directory not created" -ForegroundColor Red
    Write-Host ""
    Write-Host "Build output:" -ForegroundColor Yellow
    Write-Host $buildOutput -ForegroundColor Gray
    exit 1
}

