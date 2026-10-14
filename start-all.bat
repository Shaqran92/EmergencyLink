@echo off
echo ========================================================
echo   Starting EmergencyLink Healthcare Coordination Suite
echo ========================================================

echo [1/3] Starting Python AI/ML Microservice (FastAPI :8000)...
start "EmergencyLink AI/ML Microservice" cmd /k "cd /d "%~dp0ai-ml-service" && python -m uvicorn app.main:app --host 0.0.0.0 --port 8000"

echo [2/3] Starting Node.js Backend API & Socket.IO (:5000)...
start "EmergencyLink Backend API" cmd /k "cd /d "%~dp0backend" && npm start"

echo Initializing backend services (waiting 3 seconds)...
timeout /t 3 /nobreak >nul

echo [3/3] Starting React Vite Frontend (:5173)...
start "EmergencyLink Frontend" cmd /k "cd /d "%~dp0frontend" && npm run dev"

echo.
echo ========================================================
echo   All 3 services have been launched in separate windows!
echo.
echo   - Web App UI:        http://localhost:5173
echo   - Backend REST API:  http://localhost:5000/api/v1/health
echo   - AI/ML Microservice: http://localhost:8000/docs
echo.
echo   Demo Login:
echo   - Coordinator:   coordinator@demo.test / Demo@12345
echo   - Hospital Staff: hospital@demo.test / Demo@12345
echo   - Ambulance Crew: ambulance@demo.test / Demo@12345
echo   - System Admin:   admin@demo.test / Demo@12345
echo ========================================================
pause
