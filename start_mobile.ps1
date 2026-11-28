# EEYES PRO Mobile App Startup Script (PowerShell)
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
if (-not $scriptDir) { $scriptDir = "C:\Users\LENOVO\.gemini\antigravity\scratch\eeyes-pro-mobile" }
Set-Location $scriptDir

Write-Host "==============================================================" -ForegroundColor Cyan
Write-Host "  EEYES PRO - Mobile Application Server for Android & iOS" -ForegroundColor Green
Write-Host "==============================================================" -ForegroundColor Cyan
Write-Host "Starting mobile server on Port 3001..." -ForegroundColor Yellow

$agyNode = "$env:APPDATA\Antigravity\bin\agy-node.cmd"
$env:ELECTRON_RUN_AS_NODE = "1"
$env:MOBILE_PORT = "3001"

Start-Process -FilePath "cmd.exe" -ArgumentList "/c `"$agyNode`" `"$scriptDir\mobile_server.js`"" -WorkingDirectory $scriptDir

Start-Sleep -Seconds 2

Write-Host "Server is active! Opening Mobile App..." -ForegroundColor Green
Start-Process "http://localhost:3001"
