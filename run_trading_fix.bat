@echo off
REM Trading System Diagnostic & Repair Tool Launcher
REM Easy launcher for Windows users

echo ========================================
echo Trading System Diagnostic & Repair Tool
echo ========================================
echo.

REM Check if Python is installed
python --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Python is not installed or not in PATH
    echo Please install Python 3.7+ and try again
    pause
    exit /b 1
)

echo Python found. Starting Trading Fix Tool...
echo.

REM Display menu
echo Choose an option:
echo 1. Run System Diagnostics
echo 2. Fix Issues (Accurate Mode)
echo 3. Fix Issues (Force Win Mode - Demo)
echo 4. Full Cycle with Report
echo 5. Dry Run (Preview Only)
echo 6. Advanced Options
echo 7. Exit
echo.
set /p choice="Enter your choice (1-7): "

if "%choice%"=="1" (
    echo.
    echo Running system diagnostics...
    python trading_fix.py diagnose --verbose
) else if "%choice%"=="2" (
    echo.
    echo Applying fixes (accurate mode)...
    python trading_fix.py fix --verbose
) else if "%choice%"=="3" (
    echo.
    echo WARNING: Force Win Mode - All positions will be made profitable
    echo This is for DEMO/TESTING purposes only!
    set /p confirm="Are you sure? (y/N): "
    if /i "%confirm%"=="y" (
        python trading_fix.py fix --force-win --verbose
    ) else (
        echo Cancelled.
    )
) else if "%choice%"=="4" (
    echo.
    echo Running full diagnostic and repair cycle...
    python trading_fix.py full --report --verbose
) else if "%choice%"=="5" (
    echo.
    echo Previewing fixes (dry run)...
    python trading_fix.py fix --dry-run --verbose
) else if "%choice%"=="6" (
    echo.
    echo Advanced Options:
    echo.
    echo Available commands:
    echo   python trading_fix.py diagnose --help
    echo   python trading_fix.py fix --help
    echo   python trading_fix.py full --help
    echo.
    echo Examples:
    echo   python trading_fix.py diagnose --db custom.db
    echo   python trading_fix.py fix --force-win --dry-run
    echo   python trading_fix.py full --report --force-win
    echo.
    set /p custom="Enter custom command: "
    if not "%custom%"=="" (
        python %custom%
    )
) else if "%choice%"=="7" (
    echo Exiting...
    exit /b 0
) else (
    echo Invalid choice. Please try again.
    pause
    goto :EOF
)

echo.
echo Operation completed. Check the output above for results.
echo.
pause
