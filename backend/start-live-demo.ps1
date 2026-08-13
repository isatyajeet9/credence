# ============================================================================
# Credence — live-demo restart script
# Run this fresh after any laptop shutdown / restart, BEFORE the presentation.
# Starts the backend + ngrok, then prints exactly what to paste into
# Vercel and Razorpay. Those two steps still need to be done by hand in
# their dashboards — this script only handles the local side.
# ============================================================================

$ErrorActionPreference = "Stop"
$backendDir = "D:\Credence\backend"
$ngrokExe = "C:\Users\Satyajeet\AppData\Local\Microsoft\WinGet\Packages\Ngrok.Ngrok_Microsoft.Winget.Source_8wekyb3d8bbwe\ngrok.exe"

Write-Host "`n=== 1. Freeing port 8000 if anything stale is holding it ===" -ForegroundColor Cyan
Get-NetTCPConnection -LocalPort 8000 -State Listen -ErrorAction SilentlyContinue |
    Select-Object -ExpandProperty OwningProcess -Unique |
    ForEach-Object { try { Stop-Process -Id $_ -Force -ErrorAction Stop; Write-Host "  stopped stale process $_" } catch {} }

Write-Host "`n=== 2. Starting backend (uvicorn) in a new window ===" -ForegroundColor Cyan
Start-Process -FilePath "$backendDir\.venv\Scripts\uvicorn.exe" -ArgumentList "app.main:app --host 127.0.0.1 --port 8000" -WorkingDirectory $backendDir
Write-Host "  waiting for it to come up..."
$backendUp = $false
for ($i = 0; $i -lt 30; $i++) {
    Start-Sleep -Seconds 2
    try {
        Invoke-WebRequest -Uri "http://127.0.0.1:8000/docs" -TimeoutSec 2 -UseBasicParsing | Out-Null
        $backendUp = $true
        break
    } catch {}
}
if (-not $backendUp) {
    Write-Host "  !! backend did not come up after 60s — check the new window for errors" -ForegroundColor Red
    exit 1
}
Write-Host "  backend is up on http://127.0.0.1:8000" -ForegroundColor Green

Write-Host "`n=== 3. Starting ngrok in a new window ===" -ForegroundColor Cyan
Get-Process ngrok -ErrorAction SilentlyContinue | ForEach-Object {
    try { Stop-Process -Id $_.Id -Force -ErrorAction Stop; Write-Host "  stopped stale ngrok process $($_.Id) (free tier only allows 1 session)" } catch {}
}
Start-Sleep -Seconds 1
Start-Process -FilePath $ngrokExe -ArgumentList "http 8000"
Write-Host "  waiting for the tunnel..."
$ngrokUrl = $null
for ($i = 0; $i -lt 20; $i++) {
    Start-Sleep -Seconds 1
    try {
        $resp = Invoke-RestMethod -Uri "http://127.0.0.1:4040/api/tunnels" -TimeoutSec 2
        $https = $resp.tunnels | Where-Object { $_.proto -eq "https" } | Select-Object -First 1
        if ($https) { $ngrokUrl = $https.public_url; break }
    } catch {}
}
if (-not $ngrokUrl) {
    Write-Host "  !! could not read the ngrok URL automatically — check the ngrok window and copy the https:// URL manually" -ForegroundColor Red
    exit 1
}

Write-Host "`n=== READY ===" -ForegroundColor Green
Write-Host "  ngrok URL: $ngrokUrl`n"

Write-Host "Now do these two manual steps BEFORE demoing:" -ForegroundColor Yellow
Write-Host "  1) Vercel  ->  Project Settings -> Environment Variables"
Write-Host "     Set NEXT_PUBLIC_API_BASE_URL = $ngrokUrl"
Write-Host "     Then Deployments -> latest -> ... -> Redeploy (env vars need a rebuild to take effect)"
Write-Host ""
Write-Host "  2) Razorpay Dashboard -> Settings -> Webhooks -> (your live webhook)"
Write-Host "     Set URL = $ngrokUrl/billing/webhook"
Write-Host ""
Write-Host "Do a full test run-through (signup -> check -> a real small upgrade) BEFORE the panel arrives." -ForegroundColor Yellow
