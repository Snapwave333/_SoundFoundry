# Production Verification Script for promptbloom.app (PowerShell)
# Run after DNS propagation and Vercel deployment

param(
    [string]$SiteUrl = "https://promptbloom.app",
    [string]$ApiUrl = "https://api.promptbloom.app"
)

$ErrorActionPreference = "Stop"

Write-Host "🔍 Verifying $SiteUrl..." -ForegroundColor Cyan
Write-Host ""

$Pass = 0
$Fail = 0

function Test-Url {
    param([string]$Name, [string]$Url, [int]$ExpectedStatus = 200)
    
    Write-Host "Checking $Name... " -NoNewline
    
    try {
        $response = Invoke-WebRequest -Uri $Url -Method Head -UseBasicParsing -ErrorAction Stop
        if ($response.StatusCode -eq $ExpectedStatus) {
            Write-Host "✓ PASS" -ForegroundColor Green
            $script:Pass++
            return $true
        } else {
            Write-Host "✗ FAIL (got $($response.StatusCode), expected $ExpectedStatus)" -ForegroundColor Red
            $script:Fail++
            return $false
        }
    } catch {
        $statusCode = $_.Exception.Response.StatusCode.value__
        if ($statusCode -eq $ExpectedStatus) {
            Write-Host "✓ PASS" -ForegroundColor Green
            $script:Pass++
            return $true
        } else {
            Write-Host "✗ FAIL (got $statusCode, expected $ExpectedStatus)" -ForegroundColor Red
            $script:Fail++
            return $false
        }
    }
}

function Test-Header {
    param([string]$Name, [string]$HeaderName, [string]$Url)
    
    Write-Host "Checking $Name... " -NoNewline
    
    try {
        $response = Invoke-WebRequest -Uri $Url -Method Head -UseBasicParsing -ErrorAction Stop
        $header = $response.Headers[$HeaderName]
        
        if ($header) {
            Write-Host "✓ PASS ($header)" -ForegroundColor Green
            $script:Pass++
            return $true
        } else {
            Write-Host "✗ FAIL (header not found)" -ForegroundColor Red
            $script:Fail++
            return $false
        }
    } catch {
        Write-Host "✗ FAIL" -ForegroundColor Red
        $script:Fail++
        return $false
    }
}

function Test-Content {
    param([string]$Name, [string]$Url, [string]$Pattern)
    
    Write-Host "Checking $Name... " -NoNewline
    
    try {
        $content = Invoke-WebRequest -Uri $Url -UseBasicParsing -ErrorAction Stop
        if ($content.Content -match $Pattern) {
            Write-Host "✓ PASS" -ForegroundColor Green
            $script:Pass++
            return $true
        } else {
            Write-Host "✗ FAIL" -ForegroundColor Red
            $script:Fail++
            return $false
        }
    } catch {
        Write-Host "✗ FAIL" -ForegroundColor Red
        $script:Fail++
        return $false
    }
}

# 1. Homepage
Test-Url "Homepage (200)" $SiteUrl

# 2. Marketing Pages
$pages = @("pricing", "about", "contact", "privacy", "terms")
foreach ($page in $pages) {
    Test-Url "$page page (200)" "$SiteUrl/$page"
}

# 3. Dashboard redirect
Write-Host "Checking /app redirect... " -NoNewline
try {
    $response = Invoke-WebRequest -Uri "$SiteUrl/app" -Method Head -MaximumRedirection 0 -UseBasicParsing -ErrorAction Stop
    Write-Host "✗ FAIL (no redirect)" -ForegroundColor Red
    $Fail++
} catch {
    $statusCode = $_.Exception.Response.StatusCode.value__
    if ($statusCode -in @(302, 307, 401)) {
        Write-Host "✓ PASS ($statusCode)" -ForegroundColor Green
        $Pass++
    } else {
        Write-Host "✗ FAIL (got $statusCode, expected 302/307/401)" -ForegroundColor Red
        $Fail++
    }
}

# 4. Robots.txt
Test-Url "robots.txt (200)" "$SiteUrl/robots.txt"

# 5. Sitemap.xml
Test-Url "sitemap.xml (200)" "$SiteUrl/sitemap.xml"

# 6. Security Headers
Test-Header "Strict-Transport-Security" "Strict-Transport-Security" $SiteUrl
Test-Header "X-Content-Type-Options" "X-Content-Type-Options" $SiteUrl
Test-Header "X-Frame-Options" "X-Frame-Options" $SiteUrl
Test-Header "Referrer-Policy" "Referrer-Policy" $SiteUrl
Test-Header "Permissions-Policy" "Permissions-Policy" $SiteUrl
Test-Header "Content-Security-Policy" "Content-Security-Policy" $SiteUrl

# 7. Verify robots.txt excludes /app
Test-Content "robots.txt excludes /app" "$SiteUrl/robots.txt" "Disallow: /app"

# 8. Verify sitemap includes marketing pages
Write-Host "Checking sitemap includes marketing pages... " -NoNewline
try {
    $sitemap = Invoke-WebRequest -Uri "$SiteUrl/sitemap.xml" -UseBasicParsing -ErrorAction Stop
    if ($sitemap.Content -match [regex]::Escape("$SiteUrl/pricing") -and 
        $sitemap.Content -match [regex]::Escape("$SiteUrl/about")) {
        Write-Host "✓ PASS" -ForegroundColor Green
        $Pass++
    } else {
        Write-Host "✗ FAIL" -ForegroundColor Red
        $Fail++
    }
} catch {
    Write-Host "✗ FAIL" -ForegroundColor Red
    $Fail++
}

# Summary
Write-Host ""
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host "Results: $Pass passed, $Fail failed" -ForegroundColor $(if ($Fail -eq 0) { "Green" } else { "Yellow" })
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan

if ($Fail -eq 0) {
    Write-Host "✅ All checks passed!" -ForegroundColor Green
    exit 0
} else {
    Write-Host "❌ Some checks failed. Review above." -ForegroundColor Red
    exit 1
}

