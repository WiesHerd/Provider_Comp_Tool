# Build Status Checker Script
param(
    [switch]$Build,
    [switch]$Deploy
)

$projectPath = "c:\Users\wherd\Python Projects\Provider_Comp_Tool"
Set-Location $projectPath

Write-Host "🔍 Checking Build Status..." -ForegroundColor Cyan
Write-Host ""

# Check if build exists
if (Test-Path "out\index.html") {
    $fileCount = (Get-ChildItem "out" -Recurse -File | Measure-Object).Count
    $indexSize = (Get-Item "out\index.html").Length
    $buildTime = (Get-Item "out\index.html").LastWriteTime
    
    Write-Host "✅ BUILD EXISTS" -ForegroundColor Green
    Write-Host "   Files: $fileCount" -ForegroundColor Gray
    Write-Host "   index.html: $indexSize bytes" -ForegroundColor Gray
    Write-Host "   Last Modified: $buildTime" -ForegroundColor Gray
    Write-Host ""
    
    if ($Deploy) {
        Write-Host "🚀 Deploying to Firebase..." -ForegroundColor Yellow
        firebase deploy --only hosting
    } else {
        Write-Host "✅ Ready to deploy! Run: npm run deploy" -ForegroundColor Green
    }
} else {
    Write-Host "❌ BUILD NOT FOUND" -ForegroundColor Red
    Write-Host ""
    
    if ($Build) {
        Write-Host "🔨 Building for Firebase..." -ForegroundColor Yellow
        npm run build:firebase
        
        Write-Host ""
        if (Test-Path "out\index.html") {
            $fileCount = (Get-ChildItem "out" -Recurse -File | Measure-Object).Count
            Write-Host "✅ BUILD SUCCESSFUL! ($fileCount files)" -ForegroundColor Green
            
            if ($Deploy) {
                Write-Host ""
                Write-Host "🚀 Deploying to Firebase..." -ForegroundColor Yellow
                firebase deploy --only hosting
            }
        } else {
            Write-Host "❌ BUILD FAILED - Check errors above" -ForegroundColor Red
        }
    } else {
        Write-Host "💡 Run with -Build to build now:" -ForegroundColor Yellow
        Write-Host "   .\check-build.ps1 -Build" -ForegroundColor Cyan
        Write-Host ""
        Write-Host "💡 Or build and deploy:" -ForegroundColor Yellow
        Write-Host "   .\check-build.ps1 -Build -Deploy" -ForegroundColor Cyan
    }
}












