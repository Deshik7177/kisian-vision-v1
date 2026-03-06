$ErrorActionPreference = 'Stop'

$backendPath = Join-Path $PSScriptRoot '..\backend'
$backendPath = (Resolve-Path $backendPath).Path
Set-Location $backendPath

$listener = Get-NetTCPConnection -LocalPort 5000 -State Listen -ErrorAction SilentlyContinue
if ($listener) {
    $ownerPid = $listener[0].OwningProcess
    Write-Host "Stopping process on port 5000 (PID=$ownerPid)..." -ForegroundColor Yellow
    Stop-Process -Id $ownerPid -Force -ErrorAction SilentlyContinue
    Start-Sleep -Seconds 1
}

$pythonExe = "C:\Users\SURESH KOTA\AppData\Local\Programs\Python\Python310\python.exe"
if (-not (Test-Path $pythonExe)) {
    throw "Python 3.10 not found at $pythonExe. Update scripts/start_backend.ps1"
}

Write-Host "Starting backend on http://127.0.0.1:8000 ..." -ForegroundColor Green
& $pythonExe -m uvicorn main:app --reload
