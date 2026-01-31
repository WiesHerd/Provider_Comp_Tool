# Script to fix all pages for static export by wrapping in dynamic imports

Write-Host "Fixing pages for static export..." -ForegroundColor Cyan

# List of pages that need fixing (already have 'use client' but need dynamic import wrapper)
$pages = @(
    @{ path = "app\wrvu-modeler\page.tsx"; client = "app\wrvu-modeler\WRVUModelerClient.tsx" },
    @{ path = "app\wrvu-forecaster\page.tsx"; client = "app\wrvu-forecaster\WRVUForecasterClient.tsx" },
    @{ path = "app\provider-wrvu-tracking\page.tsx"; client = "app\provider-wrvu-tracking\ProviderWRVUTrackingClient.tsx" },
    @{ path = "app\fmv-calculator\page.tsx"; client = "app\fmv-calculator\FMVCalculatorClient.tsx" },
    @{ path = "app\fmv-calculator\cf\page.tsx"; client = "app\fmv-calculator\cf\CFCalculatorClient.tsx" },
    @{ path = "app\fmv-calculator\wrvu\page.tsx"; client = "app\fmv-calculator\wrvu\WRVUCalculatorClient.tsx" },
    @{ path = "app\fmv-calculator\tcc\page.tsx"; client = "app\fmv-calculator\tcc\TCCCalculatorClient.tsx" },
    @{ path = "app\call-pay-modeler\page.tsx"; client = "app\call-pay-modeler\CallPayModelerClient.tsx" },
    @{ path = "app\provider-comparison\page.tsx"; client = "app\provider-comparison\ProviderComparisonClient.tsx" },
    @{ path = "app\market-data\page.tsx"; client = "app\market-data\MarketDataClient.tsx" },
    @{ path = "app\physician-scenarios\page.tsx"; client = "app\physician-scenarios\PhysicianScenariosClient.tsx" },
    @{ path = "app\scenarios\page.tsx"; client = "app\scenarios\ScenariosClient.tsx" },
    @{ path = "app\internal-benchmark-engine\page.tsx"; client = "app\internal-benchmark-engine\InternalBenchmarkEngineClient.tsx" },
    @{ path = "app\cf-stewardship-dashboard\page.tsx"; client = "app\cf-stewardship-dashboard\CFStewardshipDashboardClient.tsx" },
    @{ path = "app\call-programs\page.tsx"; client = "app\call-programs\CallProgramsClient.tsx" }
)

Write-Host "Found $($pages.Count) pages to fix" -ForegroundColor Yellow
Write-Host "Note: This script lists pages that need manual fixing" -ForegroundColor Gray
Write-Host "Each page needs:" -ForegroundColor Cyan
Write-Host "  1. Component code moved to *Client.tsx" -ForegroundColor Gray
Write-Host "  2. page.tsx updated to use dynamic import with ssr: false" -ForegroundColor Gray










