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
echo Key hidden prompt se li jayegi aur backend\.env mein save hogi.
echo Ye key GitHub par commit nahi ki jayegi.
powershell -NoProfile -ExecutionPolicy Bypass -Command "$s=Read-Host 'Gemini API key paste karein (input hidden rahega)' -AsSecureString; $p=[Runtime.InteropServices.Marshal]::SecureStringToBSTR($s); try { $k=[Runtime.InteropServices.Marshal]::PtrToStringBSTR($p); if ([string]::IsNullOrWhiteSpace($k)) { exit 2 }; @('GEMINI_API_KEY=' + $k,'GEMINI_MODEL=gemini-2.5-flash','PORT=3000') | Set-Content -Encoding ascii 'backend\.env' } finally { [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($p) }"
if errorlevel 1 (
  echo API key save nahi hui. Setup roka gaya.
  pause
  exit /b 1
)
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
