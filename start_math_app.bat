@echo off
setlocal
echo ==========================================
echo    MathHandwrite Pro - 起動スクリプト
echo ==========================================
echo.
cd /d "%~dp0"

echo [1/2] ネットワークサーバーを起動しています...
echo.
echo ※ 起動後、画面に表示される「Network: http://192.168.x.x:5173/」
echo    というアドレスを iPad の Safari で開いてください。
echo.

npm.cmd run dev -- --host

pause
