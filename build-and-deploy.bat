@echo off
echo Building Swan Echo Portal for XAMPP deployment...

REM Navigate to project directory
cd /d "%~dp0"

REM Install dependencies if node_modules doesn't exist
if not exist "node_modules" (
    echo Installing dependencies...
    npm install
)

REM Build the project
echo Building project...
npm run build

REM Create deployment directory in XAMPP htdocs
set XAMPP_PATH=C:\xampp\htdocs
set PROJECT_NAME=swan-echo-portal

REM Create project directory in htdocs
if not exist "%XAMPP_PATH%\%PROJECT_NAME%" (
    mkdir "%XAMPP_PATH%\%PROJECT_NAME%"
)

REM Copy built files to XAMPP htdocs
echo Copying files to XAMPP htdocs...
xcopy "dist\*" "%XAMPP_PATH%\%PROJECT_NAME%\" /E /Y /I

REM Copy .htaccess file
copy ".htaccess" "%XAMPP_PATH%\%PROJECT_NAME%\" /Y

echo.
echo ========================================
echo Deployment completed!
echo ========================================
echo.
echo Your application is now available at:
echo http://localhost/%PROJECT_NAME%
echo.
echo Make sure XAMPP Apache is running!
echo.
pause 