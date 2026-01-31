# Quick Deploy Script
Write-Host "=== STEP 1: Moving API routes ===" -ForegroundColor Cyan
if (Test-Path "app\api") {
    if (Test-Path "app\api.backup") {
        Remove-Item -Recurse -Force "app\api.backup"
    }
    Move-Item "app\api" "app\api.backup" -Force
    Write-Host "✓ API routes moved" -ForegroundColor Green
} else {
    Write-Host "✓ No API routes to move" -ForegroundColor Green
}

Write-Host "`n=== STEP 2: Cleaning ===" -ForegroundColor Cyan
Remove-Item -Recurse -Force .next,out -ErrorAction SilentlyContinue
Write-Host "✓ Cleaned" -ForegroundColor Green

Write-Host "`n=== STEP 3: Building ===" -ForegroundColor Cyan
npm run build

if (Test-Path "out\index.html") {
    Write-Host "`n✓✓✓ BUILD SUCCESS! ✓✓✓" -ForegroundColor Green
    $size = (Get-Item "out\index.html").Length
    Write-Host "index.html: $size bytes" -ForegroundColor Green
    
    Write-Host "`n=== STEP 4: Deploying ===" -ForegroundColor Cyan
    firebase use complens-88a4f
    firebase deploy --only hosting
    
    Write-Host "`n✓✓✓ DEPLOYMENT COMPLETE! ✓✓✓" -ForegroundColor Green
} else {
    Write-Host "`n✗ BUILD FAILED - Check errors above" -ForegroundColor Red
    exit 1
}










