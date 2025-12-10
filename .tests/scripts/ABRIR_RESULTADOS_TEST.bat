@echo off
REM Abre el Dashboard de Resultados del Test Real en el navegador por defecto
REM Creado para CaraColaViajes - 8 de Diciembre 2025

setlocal enabledelayedexpansion

REM Obtener la ruta del script
for %%I in ("%~dp0.") do set SCRIPT_DIR=%%~fI

REM Construir la ruta completa del HTML
set HTML_FILE=%SCRIPT_DIR%\DASHBOARD_REAL_TEST_RESULTADOS.html

REM Verificar que el archivo existe
if not exist "%HTML_FILE%" (
    echo.
    echo ========================================
    echo ERROR: No se encuentra el archivo
    echo %HTML_FILE%
    echo ========================================
    echo.
    pause
    exit /b 1
)

REM Convertir a URL de archivo local
set FILE_URL=file:///%HTML_FILE:\=/%

REM Abrir en el navegador por defecto
echo Abriendo resultados del test...
start "" "%FILE_URL%"

REM Mostrar confirmacion
echo.
echo ========================================
echo Dashboard de Resultados Abierto
echo ========================================
echo.
echo Ubicacion: %HTML_FILE%
echo.
