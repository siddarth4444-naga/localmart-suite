@echo off
echo ========================================================
echo   Starting LocalMart Two-App System
echo   1. Sync Bridge Server (Port 5000)
echo   2. Customer App (Port 8081)
echo   3. Shopkeeper App (Port 8082)
echo ========================================================

start "LocalMart Sync Bridge" cmd /k "cd /d %~dp0 && node sync-server.js"
timeout /t 2 >nul
start "LocalMart Customer App" cmd /k "cd /d %~dp0..\LocalMart-Customer && npx expo start --web --port 8081 --clear"
timeout /t 2 >nul
start "LocalMart Shopkeeper App" cmd /k "cd /d %~dp0..\LocalMart-Shopkeeper && npx expo start --web --port 8082 --clear"
timeout /t 2 >nul
start "LocalMart Delivery App" cmd /k "cd /d %~dp0..\LocalMart-Delivery && npx expo start --web --port 8083 --clear"

echo Apps launched!
echo Customer: http://localhost:8081
echo Shopkeeper: http://localhost:8082
echo Delivery: http://localhost:8083
pause
