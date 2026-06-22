@echo off
echo ===================================================
echo REVERTING DAVIS INSTRUMENTS WEATHERLINK INTEGRATION
echo ===================================================
echo.

setlocal enabledelayedexpansion

:: Check directories
if not exist "backend\src\routes\stations.js.bak" (
    echo Error: backup files not found in backend/src/routes/stations.js.bak
    pause
    exit /b 1
)

:: Revert files
copy /Y "backend\src\routes\stations.js.bak" "backend\src\routes\stations.js"
copy /Y "src\pages\InteractiveMap.jsx.bak" "src\pages\InteractiveMap.jsx"
copy /Y "src\styles\pages\InteractiveMap.css.bak" "src\styles\pages\InteractiveMap.css"

echo.
echo ===================================================
echo Revert complete! Original files have been restored.
echo Please restart the servers.
echo ===================================================
pause
