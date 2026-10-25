@echo off
title Kisan Mitra Setup
cd /d "%~dp0"
echo ======================================
echo       Kisan Mitra - First Setup
echo ======================================
echo.
if not exist "backend\server.js" (
  echo ERROR: backend\server.js nahi mila. Pehle latest GitHub project download karein.
  pause
  exit /b 1
)
echo Google AI Studio se apni Gemini API key copy karein.
echo Key sirf is computer par backend\.env mein save hogi; GitHub par upload nahi hogi.
set /p "GEMINI_KEY=API key yahan paste karein (screen par type dikh sakta hai): "
if "%GEMINI_KEY%"=="" (
  echo API key khali hai. Setup roka gaya.
  pause
  exit /b 1
)
(
  echo GEMINI_API_KEY=%GEMINI_KEY%
  echo GEMINI_MODEL=gemini-2.5-flash
  echo PORT=3000
) > "backend\.env"
set "GEMINI_KEY="
echo.
echo Dependencies install ho rahi hain...
cd backend
call npm install
if errorlevel 1 (
  echo npm install fail hua. Node.js 20 ya newer aur internet connection check karein.
  pause
  exit /b 1
)
echo.
echo Setup complete. Kisan Mitra backend start ho raha hai...
call npm start
pause
