@echo off
cd /d "%~dp0"
"%~dp0.venv\Scripts\python.exe" -m f1_strategy.webserver --open
if errorlevel 1 pause
