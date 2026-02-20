@echo off
echo Starting Swan Echo Portal Backend Server...

REM Navigate to project directory
cd /d "%~dp0"

REM Install dependencies if node_modules doesn't exist
if not exist "node_modules" (
    echo Installing dependencies...
    npm install
)

echo.
echo ========================================
echo Backend Server Starting...
echo ========================================
echo.
echo The backend API will be available at:
echo http://localhost:3001
echo.
echo Available API endpoints:
echo - GET  /api/health
echo - GET  /api/users
echo - GET  /api/transactions
echo - GET  /api/crypto/prices
echo - GET  /api/dashboard/stats
echo - POST /api/auth/login
echo - POST /api/auth/register
echo.
echo Press Ctrl+C to stop the server
echo.

REM Start the backend server
npm run server 