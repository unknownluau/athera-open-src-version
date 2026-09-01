@echo off
git pull
taskkill /f /im RCCService.exe
start cmd /c "cd /d 2016-roblox-main && call run.bat"
start /b cmd /c "cd /d RCCService && call run.bat"
start cmd /c "cd /d DiscordBot && call run.bat"
start cmd /c "cd /d AssetDelivery && call run.bat"
start cmd /c "cd /d roproxy && call run.bat"
start cmd /c "cd /d setup && call run.bat"
timeout /t 2 >nul
start /b cmd /c "cd /d renderer && call run.bat"
start /b cmd /c "cd /d AssetValidationServiceV2 && call run.bat"
start cmd /c "cd /d Roblox && dev.bat"
start /b redis-server.exe