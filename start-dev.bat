@echo off
title Mero Business - Dev Servers
color 0A
echo.
echo  ================================================
echo   Mero Business - Starting Development Servers
echo  ================================================
echo.

:: Kill anything already on these ports
echo [1/4] Clearing old processes...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":8080 " 2^>nul') do taskkill /F /PID %%a >nul 2>&1
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":3000 " 2^>nul') do taskkill /F /PID %%a >nul 2>&1

:: Start Backend
echo [2/4] Starting Backend (FastAPI on port 8080)...
start "Mero Business - Backend" cmd /k "cd /d "%~dp0pos-app\backend" && .venv\Scripts\uvicorn.exe app.main:app --host 127.0.0.1 --port 8080 --reload"

:: Wait for backend to be ready
timeout /t 3 /nobreak >nul

:: Start Web Dashboard
echo [3/4] Starting Web Dashboard (Next.js on port 3000)...
start "Mero Business - Web Dashboard" cmd /k "cd /d "%~dp0pos-app\web-dashboard" && npx next dev"

echo [4/4] Done! Opening browser in 5 seconds...
timeout /t 5 /nobreak >nul
start http://localhost:3000

echo.
echo  ================================================
echo   All servers started!
echo   Backend  : http://127.0.0.1:8080
echo   Dashboard: http://localhost:3000
echo   API Docs : http://127.0.0.1:8080/docs
echo  ================================================
echo.
echo  To stop: close the Backend and Web Dashboard windows.
pause
