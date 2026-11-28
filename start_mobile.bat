@echo off
title EEYES PRO - Mobile Application Server
cd /d "%~dp0"

echo ==============================================================
echo   EEYES PRO - Mobile Application Server for Android & iOS
echo ==============================================================
echo Starting local mobile server on Port 3001...

set ELECTRON_RUN_AS_NODE=1
set MOBILE_PORT=3001

:: Automatically open browser preview after 2 seconds in background
start /min cmd /c "timeout /t 2 /nobreak >nul && start http://localhost:3001"

:: Start Node server directly in this window
"%APPDATA%\Antigravity\bin\agy-node.cmd" "%~dp0mobile_server.js"
pause
