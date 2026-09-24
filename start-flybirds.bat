@echo off
cd /d "%~dp0"
title Flybirds setup
echo.
echo  ==== Flybirds setup ====
echo.
if exist ".setup-done" goto run

echo  Paste your Neon connection string (starts with postgresql://)
echo  Tip: right-click inside this window to paste, then press Enter.
echo.
set /p DBURL=  Connection string: 
if "%DBURL%"=="" ( echo No string entered. & pause & exit /b 1 )

for /f %%s in ('node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"') do set SECRET=%%s

> .env echo DATABASE_URL="%DBURL%"
>> .env echo AUTH_SECRET="%SECRET%"
>> .env echo NEXT_PUBLIC_APP_URL="http://localhost:3000"
echo  .env written.

echo.
echo  [1/3] Creating database tables...
call npm.cmd run db:push || ( echo. & echo  db:push failed - copy the error above to Claude. & pause & exit /b 1 )
echo.
echo  [2/3] Loading demo products...
call npm.cmd run db:seed || ( echo. & echo  Seed failed - copy the error above to Claude. & pause & exit /b 1 )
echo done> .setup-done

:run
echo.
echo  [3/3] Starting Flybirds at http://localhost:3000  (close this window to stop)
start "" http://localhost:3000
call npm.cmd run dev
pause
