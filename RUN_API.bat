@echo off
cd /d "%~dp0backend\FactoryTowA.API"
dotnet restore
if errorlevel 1 pause & exit /b 1
dotnet run --launch-profile http
pause
