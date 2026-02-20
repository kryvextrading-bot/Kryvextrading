Write-Host "Starting Swan IRA Application..." -ForegroundColor Green
Write-Host ""

# Start backend server
Write-Host "Starting backend server..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "npm run server" -WindowStyle Normal

# Wait for backend to start
Write-Host "Waiting for backend to start..." -ForegroundColor Yellow
Start-Sleep -Seconds 3

# Start frontend server
Write-Host "Starting frontend development server..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "npm run dev" -WindowStyle Normal

# Wait for frontend to start
Write-Host "Waiting for frontend to start..." -ForegroundColor Yellow
Start-Sleep -Seconds 5

# Open Chrome
Write-Host "Opening Swan IRA in Chrome..." -ForegroundColor Green
Start-Process "chrome" -ArgumentList "http://localhost:5173"

Write-Host ""
Write-Host "Swan IRA Application is now running!" -ForegroundColor Green
Write-Host ""
Write-Host "Frontend: http://localhost:5173" -ForegroundColor Cyan
Write-Host "Backend API: http://localhost:3001" -ForegroundColor Cyan
Write-Host "Quick Access: http://localhost:5173/#/quick-access" -ForegroundColor Cyan
Write-Host ""
Write-Host "Test Credentials:" -ForegroundColor Yellow
Write-Host "- Email: john.doe@email.com" -ForegroundColor White
Write-Host "- Password: password" -ForegroundColor White
Write-Host ""
Write-Host "Press any key to exit..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown") 