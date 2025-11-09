# Key Verification Script
# Run this in EACH terminal after starting services

Write-Host "=== Verifying FAL Key ===" -ForegroundColor Cyan

python -c "import os; from dotenv import load_dotenv; load_dotenv('.env', override=True); k = os.getenv('FAL_KEY') or os.getenv('FAL_API_KEY'); print('FAL prefix:', k[:8] if k else None); print('Expected: 0b69330b'); print('Match:', k[:8] == '0b69330b' if k else False)"

if ($LASTEXITCODE -eq 0) {
    Write-Host "`n✅ Key verification complete" -ForegroundColor Green
} else {
    Write-Host "`n❌ Key verification failed" -ForegroundColor Red
}

