@echo off
echo ========================================
echo Swan Echo Portal - XAMPP Quick Setup
echo ========================================
echo.

REM Check if Node.js is installed
node --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Node.js is not installed or not in PATH
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

REM Check if XAMPP is installed
if not exist "C:\xampp\htdocs" (
    echo ERROR: XAMPP is not installed or not found in C:\xampp
    echo Please install XAMPP from https://www.apachefriends.org/
    pause
    exit /b 1
)

echo ✓ Node.js found
echo ✓ XAMPP found
echo.

REM Navigate to project directory
cd /d "%~dp0"

echo Step 1: Installing dependencies...
if not exist "node_modules" (
    npm install
    if errorlevel 1 (
        echo ERROR: Failed to install dependencies
        pause
        exit /b 1
    )
) else (
    echo ✓ Dependencies already installed
)

echo.
echo Step 2: Building the project...
npm run build
if errorlevel 1 (
    echo ERROR: Failed to build the project
    pause
    exit /b 1
)

echo.
echo Step 3: Deploying to XAMPP...
set XAMPP_PATH=C:\xampp\htdocs
set PROJECT_NAME=swan-echo-portal

REM Create project directory
if not exist "%XAMPP_PATH%\%PROJECT_NAME%" (
    mkdir "%XAMPP_PATH%\%PROJECT_NAME%"
)

REM Copy built files
xcopy "dist\*" "%XAMPP_PATH%\%PROJECT_NAME%\" /E /Y /I
if errorlevel 1 (
    echo ERROR: Failed to copy files to XAMPP
    pause
    exit /b 1
)

REM Copy .htaccess file
copy ".htaccess" "%XAMPP_PATH%\%PROJECT_NAME%\" /Y

echo.
echo ========================================
echo Setup completed successfully!
echo ========================================
echo.
echo Next steps:
echo 1. Open XAMPP Control Panel
echo 2. Start Apache service
echo 3. Open a new command prompt and run: npm run server
echo 4. Access your application at: http://localhost/swan-echo-portal
echo.
echo Backend API will be available at: http://localhost:3001
echo.
echo Press any key to open XAMPP Control Panel...
pause >nul

REM Try to open XAMPP Control Panel
start "" "C:\xampp\xampp-control.exe"

echo.
echo XAMPP Control Panel should now be open.
echo Remember to start Apache and then run the backend server!
echo.
pause 