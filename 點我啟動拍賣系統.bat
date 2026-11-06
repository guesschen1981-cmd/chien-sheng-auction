@echo off
cd /d "%~dp0"
explorer.exe "http://localhost:8080/index.html"
netstat -ano | findstr ":8080 " | findstr "LISTENING" >nul 2>nul
if %errorlevel%==0 (
    exit /b 0
)
echo Starting Local Auction Server on http://localhost:8080 ...
python server.py 8080
pause
