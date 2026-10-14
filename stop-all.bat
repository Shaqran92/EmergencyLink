@echo off
echo Stopping EmergencyLink processes on ports 5000, 8000, and 5173...

for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":5000 "') do (
  taskkill /f /pid %%a 2>nul
)

for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":8000 "') do (
  taskkill /f /pid %%a 2>nul
)

for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":5173 "') do (
  taskkill /f /pid %%a 2>nul
)

echo All services stopped.
pause
