# Script to wrap client pages in dynamic imports for static export
# This prevents Next.js from trying to pre-render pages with client-side hooks

Write-Host "🔧 Fixing pages for static export..." -ForegroundColor Cyan

$pagesToFix = @(
    "app\wrvu-modeler\page.tsx",
    "app\wrvu-forecaster\page.tsx",
    "app\provider-wrvu-tracking\page.tsx",
    "app\fmv-calculator\page.tsx",
    "app\fmv-calculator\cf\page.tsx",
    "app\fmv-calculator\wrvu\page.tsx",
    "app\fmv-calculator\tcc\page.tsx",
    "app\call-pay-modeler\page.tsx",
    "app\provider-comparison\page.tsx",
    "app\market-data\page.tsx",
    "app\physician-scenarios\page.tsx",
    "app\scenarios\page.tsx",
    "app\internal-benchmark-engine\page.tsx",
    "app\cf-stewardship-dashboard\page.tsx",
    "app\call-programs\page.tsx"
)

foreach ($page in $pagesToFix) {
    if (Test-Path $page) {
        Write-Host "  Checking $page..." -ForegroundColor Gray
        $content = Get-Content $page -Raw
        
        # Check if already using dynamic import
        if ($content -notmatch "dynamic.*ssr.*false") {
            Write-Host "  ⚠️  $page needs to be wrapped in dynamic import" -ForegroundColor Yellow
        } else {
            Write-Host "  ✅ $page already uses dynamic import" -ForegroundColor Green
        }
    }
}

Write-Host "`nTo fix: Move component code to a *Client.tsx file and use dynamic import in page.tsx" -ForegroundColor Cyan
Write-Host "Example: See app/page.tsx and app/HomeClient.tsx" -ForegroundColor Gray

