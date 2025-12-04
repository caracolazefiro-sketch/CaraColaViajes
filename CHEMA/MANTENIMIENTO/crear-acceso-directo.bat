@echo off
REM =====================================================
REM CREAR ACCESO DIRECTO EN ESCRITORIO
REM =====================================================
REM Este script crea un acceso directo en el escritorio
REM para ejecutar el script de optimizacion severa
REM =====================================================

setlocal enabledelayedexpansion

echo.
echo =====================================================
echo  CREANDO ACCESO DIRECTO EN ESCRITORIO
echo =====================================================
echo.

REM Obtener ruta del escritorio
set DESKTOP=%USERPROFILE%\Desktop

REM Rutas de los scripts
set SCRIPT_PATH=C:\Users\chema\CaraColaViajes\CHEMA\MANTENIMIENTO\optimizar-severo.bat
set SHORTCUT_PATH=%DESKTOP%\Optimizar Severo.lnk

REM Crear el acceso directo usando PowerShell
powershell -NoProfile -Command ^
  "$WshShell = New-Object -ComObject WScript.Shell; " ^
  "$Shortcut = $WshShell.CreateShortcut('%SHORTCUT_PATH%'); " ^
  "$Shortcut.TargetPath = '%SCRIPT_PATH%'; " ^
  "$Shortcut.WorkingDirectory = 'C:\Users\chema\CaraColaViajes'; " ^
  "$Shortcut.Description = 'Optimizacion Severa de VS Code y Chrome'; " ^
  "$Shortcut.IconLocation = 'C:\Windows\System32\shell32.dll,14'; " ^
  "$Shortcut.Save()"

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ✅ ACCESO DIRECTO CREADO EXITOSAMENTE
    echo.
    echo Ubicacion: %SHORTCUT_PATH%
    echo.
    echo COMO USARLO:
    echo 1. Ve al Escritorio
    echo 2. Busca: "Optimizar Severo"
    echo 3. Double-click (se ejecuta automaticamente como admin)
    echo.
) else (
    echo.
    echo ❌ ERROR al crear el acceso directo
    echo.
    echo ALTERNATIVA: Usa la opcion B (Win+R)
    echo powershell -Command "Start-Process 'C:\Users\chema\CaraColaViajes\CHEMA\MANTENIMIENTO\optimizar-severo.bat' -Verb RunAs"
    echo.
)

pause
