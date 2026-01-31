# Run build with visible output
Write-Host "🚀 Starting Next.js build for Firebase..." -ForegroundColor Cyan
Write-Host ""

cd "c:\Users\wherd\Python Projects\Provider_Comp_Tool"

# Clean previous builds
Write-Host "📦 Cleaning previous builds..." -ForegroundColor Yellow
Remove-Item -ErrorAction SilentlyContinue -Recurse -Force .next, out
Write-Host "✅ Cleaned" -ForegroundColor Green
Write-Host ""

# Run build
Write-Host "🔨 Building Next.js app..." -ForegroundColor Yellow
Write-Host "This may take 2-3 minutes..." -ForegroundColor Gray
Write-Host ""

npm run build:firebase

Write-Host ""
if (Test-Path "out\index.html") {
    $fileCount = (Get-ChildItem "out" -Recurse -File | Measure-Object).Count
    Write-Host "✅ BUILD SUCCESSFUL!" -ForegroundColor Green
    Write-Host "   Files created: $fileCount" -ForegroundColor Gray
    Write-Host "   Output directory: out\" -ForegroundColor Gray
    Write-Host ""
    Write-Host "Ready to deploy!" -ForegroundColor Cyan
} else {
    Write-Host "❌ BUILD FAILED - out/index.html not found" -ForegroundColor Red
    Write-Host "Check the output above for errors" -ForegroundColor Yellow
}










