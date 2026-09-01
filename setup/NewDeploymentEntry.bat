@echo off
setlocal EnableDelayedExpansion
title Athera Version Updater

:menu
cls
set "launcher="
set "year="
set "filename="

echo Athera Version Updater
echo.
echo Enter:
echo 14 15 16 17 18 20 21
echo 0 = Launcher
echo 9 = Exit
echo.

set /p choice="> "

if "%choice%"=="9" exit

if "%choice%"=="0" (
    set "launcher=1"
    set "filename=AtheraPlayerLauncher.exe"
    goto process
)

for /f "delims=0123456789" %%a in ("%choice%") do goto menu
if not "%choice:~2%"=="" goto menu

set "year=20%choice%"
set "filename=AClient%choice%.zip"

:process
cls
echo Processing %filename%...
echo.

if not exist "files\%filename%" (
    echo File not found in files folder.
    pause
    goto menu
)

set "hash="
for /f "skip=1 delims=" %%a in ('certutil -hashfile "files\%filename%" MD5') do (
    if not defined hash set "hash=%%a"
)
set "hash=%hash: =%"

if not defined hash (
    echo Failed to calculate MD5 hash.
    pause
    goto menu
)

if exist "files\DeployHistory.txt" (
    findstr /C:"%hash%" "files\DeployHistory.txt" >nul
    if not errorlevel 1 (
        echo This version already exists.
        pause
        goto menu
    )
)

for /f "delims=" %%a in ('powershell -NoProfile -Command "Get-Date -Format \"M/d/yyyy hh:mm tt\""') do set "time=%%a"

if defined launcher (
    set "entry=New AtheraPlayerLauncher version-%hash% at %time%... Done"
) else (
    set "entry=New AtheraPlayer%year% version-%hash% at %time%... Done"
)

echo !entry! >> "files\DeployHistory.txt"
echo.
echo !entry!
echo.

set /p again="Add another? (Y/N): "
if /i "%again%"=="Y" goto menu

exit