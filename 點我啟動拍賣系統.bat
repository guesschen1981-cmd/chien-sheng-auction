@echo off
cd /d "%~dp0"

netstat -ano | findstr ":8080 " | findstr "LISTENING" >nul 2>nul
if %errorlevel% neq 0 (
    start /min "JianShengAuctionServer" python server.py 8080
    timeout /t 1 /nobreak >nul 2>nul
)

explorer.exe "http://localhost:8080/index.html"
exit /b 0
