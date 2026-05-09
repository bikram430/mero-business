@echo off
title Mero Business - Stop Servers
echo Stopping all dev servers...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":8080 " 2^>nul') do taskkill /F /PID %%a >nul 2>&1
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":3000 " 2^>nul') do taskkill /F /PID %%a >nul 2>&1
echo Done. All servers stopped.
timeout /t 2 /nobreak >nul
