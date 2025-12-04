@echo off
setlocal enabledelayedexpansion

cls
echo.
echo ========================================
echo   REINSTALAR VS CODE - LIMPIO
echo ========================================
echo.
echo Advertencia: Se borrara toda la configuracion
echo Los proyectos se mantienen
echo.
echo Deseas continuar?
echo.

set /p confirm="Escribe 's' para continuar: "
if /i not "%confirm%"=="s" (
    echo.
    echo Cancelado.
    echo.
    pause
    exit /b 1
)

echo.
echo Iniciando proceso...
echo.

REM 1. CERRAR VS CODE
echo [1/4] Cerrando VS Code...
taskkill /F /IM code.exe >nul 2>&1
timeout /t 2 /nobreak >nul
echo OK
echo.

REM 2. BORRAR CONFIG
echo [2/4] Borrando configuracion...
set "cfg=%APPDATA%\Code"
if exist "%cfg%" (
    rmdir /s /q "%cfg%" >nul 2>&1
    echo OK
) else (
    echo (no encontrada)
)
echo.

REM 3. DESINSTALAR
echo [3/4] Desinstalando VS Code...
if exist "C:\Program Files\Microsoft VS Code\unins000.exe" (
    "C:\Program Files\Microsoft VS Code\unins000.exe" /SILENT /NORESTART >nul 2>&1
    echo OK
) else (
    echo (instalacion no encontrada)
)
echo.

REM 4. REINSTALAR
echo [4/4] Descargando e instalando VS Code...
echo (esto tardara 1-2 minutos)
echo.

cd /d "%TEMP%"
powershell -NoProfile -Command "
[System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072
(New-Object System.Net.WebClient).DownloadFile('https://aka.ms/win32-x64-user-stable', 'VSCodeSetup.exe')
if (Test-Path 'VSCodeSetup.exe') {
    Write-Host 'Instalando...'
    & .\VSCodeSetup.exe /silent /mergetasks=!runCode /norestart
    timeout /t 5 /nobreak >nul
    Remove-Item 'VSCodeSetup.exe' -Force >nul 2>&1
}
"

echo.
echo Abriendo VS Code...
timeout /t 2 /nobreak >nul
code "C:\Users\chema\CaraColaViajes" >nul 2>&1

echo.
echo ========================================
echo   PROCESO COMPLETADO
echo ========================================
echo.
echo VS Code esta listo.
echo.

pause

