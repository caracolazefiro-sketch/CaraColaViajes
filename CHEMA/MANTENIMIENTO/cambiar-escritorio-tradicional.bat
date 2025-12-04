@echo off
REM =====================================================
REM CAMBIAR ESCRITORIO DE ONEDRIVE A TRADICIONAL
REM =====================================================

setlocal enabledelayedexpansion

echo.
echo =====================================================
echo CAMBIAR ESCRITORIO DE ONEDRIVE A TRADICIONAL
echo =====================================================
echo.

REM Crear carpeta Desktop si no existe
if not exist "C:\Users\chema\Desktop" (
    mkdir "C:\Users\chema\Desktop"
    echo Carpeta Desktop creada
)

REM Cambiar registro para apuntar al Desktop tradicional
reg add "HKEY_CURRENT_USER\Software\Microsoft\Windows\CurrentVersion\Explorer\Shell Folders" /v "Desktop" /t REG_SZ /d "C:\Users\chema\Desktop" /f

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ✅ ESCRITORIO CAMBIADO A TRADICIONAL
    echo.
    echo Necesitas REINICIAR EXPLORER para que se aplique el cambio
    echo.
    echo Presiona cualquier tecla para reiniciar explorer...
    pause
    
    REM Matar explorer
    taskkill /F /IM explorer.exe
    
    REM Esperar 2 segundos
    timeout /t 2 /nobreak
    
    REM Abrir explorer nuevamente
    start explorer.exe
    
    echo.
    echo ✅ Explorer reiniciado
    echo Ahora el Escritorio deberia ser el tradicional (C:\Users\chema\Desktop)
    echo.
) else (
    echo.
    echo ❌ ERROR al cambiar el registro
    echo Intenta ejecutar como Administrador
    echo.
)

pause
