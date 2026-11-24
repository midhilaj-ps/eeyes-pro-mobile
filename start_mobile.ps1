# EEYES PRO Mobile App Startup Script (PowerShell)
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $scriptDir

Write-Host "==============================================================" -ForegroundColor Cyan
Write-Host "  EEYES PRO - Mobile Application Server for Android & iOS" -ForegroundColor Green
Write-Host "==============================================================" -ForegroundColor Cyan
Write-Host "Starting mobile server on Port 3001..." -ForegroundColor Yellow

$agyNode = "$env:APPDATA\Antigravity\bin\agy-node.cmd"
Start-Process -FilePath "cmd.exe" -ArgumentList "/c `"$agyNode`" mobile_server.js" -WindowStyle Hidden

Start-Sleep -Seconds 2

Write-Host "Server is active! Opening Mobile App..." -ForegroundColor Green
Start-Process "http://localhost:3001"
