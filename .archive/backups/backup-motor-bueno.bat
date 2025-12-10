@echo off
REM Backup de motor-bueno a BACKUPS/motor-bueno-20251209
REM Este script crea una copia de toda la carpeta

setlocal enabledelayedexpansion

echo.
echo ============================================
echo BACKUP: Motor-Bueno Archive
echo ============================================
echo.

REM Crear directorio BACKUPS si no existe
if not exist "BACKUPS" (
    echo Creando directorio BACKUPS...
    mkdir BACKUPS
)

REM Crear backup timestamped
set TIMESTAMP=%date:~6,4%%date:~3,2%%date:~0,2%
set BACKUP_DIR=BACKUPS\motor-bueno-!TIMESTAMP!-stable

echo Copiando motor-bueno a !BACKUP_DIR!...
xcopy "app\motor-bueno" "!BACKUP_DIR!" /E /I /Y > nul

if !errorlevel! equ 0 (
    echo ✅ Backup completado exitosamente
    echo Ubicación: !BACKUP_DIR!
    echo.
    dir "!BACKUP_DIR!" /s /b | find /c /v "" > nul
    for /f %%i in ('dir "!BACKUP_DIR!" /s /b ^| find /c /v ""') do (
        echo Total archivos: %%i
    )
) else (
    echo ❌ Error durante el backup
    pause
    exit /b 1
)

echo.
echo Próximos pasos:
echo 1. Revisar el backup: dir !BACKUP_DIR!
echo 2. Commit a git: git add -A && git commit -m "BACKUP: Archive motor-bueno-!TIMESTAMP!-stable"
echo 3. Eliminar original: rmdir /s /q app\motor-bueno
echo.
pause
