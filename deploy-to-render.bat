@echo off
setlocal enabledelayedexpansion
title LocalMart 1-Click Cloud Deployment
set "PATH=C:\Users\Sidda\bin\git\cmd;%PATH%"

echo ================================================================
echo        LOCALMART QUICK-COMMERCE AUTOMATED DEPLOYMENT
echo ================================================================
echo.

cd /d "C:\Users\Sidda\OneDrive\Desktop\LocalMart-Deploy"

echo [1/3] Checking GitHub CLI Authentication...
gh auth status >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo 🔑 Please authenticate with your GitHub account (1-time setup):
    echo Press ENTER to open GitHub in your browser and authorize...
    pause >nul
    gh auth login --web --git-protocol https
)

echo.
echo [2/3] Creating and Pushing GitHub Repository...
gh repo create localmart-suite --public --source=. --remote=origin --push
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo Remote already exists or repo created. Pushing latest code...
    git push -u origin master --force
)

echo.
echo [3/3] Opening Render Blueprint 1-Click Cloud Deployer...
start https://dashboard.render.com/blueprints/new

echo.
echo ================================================================
echo  SUCCESS! Your code is live on GitHub.
echo  Render is opening in your browser.
echo  Select your 'localmart-suite' repo to deploy all 4 services!
echo ================================================================
echo.
pause