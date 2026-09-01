@echo off
SETLOCAL

set "Packages=fastapi pydub aiohttp uvicorn"

python --version >nul 2>&1
IF %ERRORLEVEL% NEQ 0 (
    powershell -Command "Add-Type -AssemblyName PresentationFramework;[System.Windows.MessageBox]::Show('Python is not installed, please install Python 3.12 as it is required for asset validation.','Error','OK','Error')"
    exit /b 1
)

@REM for %%P in (%Packages%) do (
@REM     python -c "import %%P" 2>nul
@REM     if %ERRORLEVEL% NEQ 0 (
@REM         echo installing package: %%P
@REM         python -m pip install %%P
@REM     ) else (
@REM         echo already installed
@REM     )
@REM )

start "" python images.py
go run main.go
