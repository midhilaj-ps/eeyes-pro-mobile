@echo off
title EEYES PRO - Mobile Application Server
cd /d "%~dp0"

echo ==============================================================
echo   EEYES PRO - Mobile Application Server for Android & iOS
echo ==============================================================
echo Starting local mobile server on Port 3001...

start "" /B cmd /c "%APPDATA%\Antigravity\bin\agy-node.cmd" mobile_server.js

timeout /t 2 /nobreak >nul

echo Server is now active!
echo Opening Mobile Preview in your browser...
start "" "http://localhost:3001"

echo --------------------------------------------------------------
echo Mobile Preview: http://localhost:3001
echo Alternative:    http://localhost:3000/mobile/
echo --------------------------------------------------------------
echo Keep this window open while using the mobile app.
pause
