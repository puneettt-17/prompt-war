@echo off
title ASTRA-GRID Production Server (3-Day Resilient Runner)
echo ===================================================
echo Starting ASTRA-GRID in High-Performance Production Mode
echo Local URL: http://localhost:3000
echo ===================================================
cd /d "%~dp0"

:loop
echo [%date% %time%] Launching Next.js Production Server...
call npx next start -p 3000
echo [%date% %time%] Server process stopped. Auto-restarting in 2 seconds...
timeout /t 2 /nobreak >nul
goto loop
