@echo off
echo Starting Swan IRA Application...
echo.

echo Starting backend server...
start "Swan IRA Backend" cmd /k "npm run server"

echo Waiting for backend to start...
timeout /t 3 /nobreak > nul

echo Starting frontend development server...
start "Swan IRA Frontend" cmd /k "npm run dev"

echo Waiting for frontend to start...
timeout /t 5 /nobreak > nul

echo Opening Swan IRA in Chrome...
start chrome "http://localhost:5173"

echo.
echo Swan IRA Application is now running!
echo.
echo Frontend: http://localhost:5173
echo Backend API: http://localhost:3001
echo Quick Access: http://localhost:5173/#/quick-access
echo.
echo Test Credentials:
echo - Email: john.doe@email.com
echo - Password: password
echo.
pause 