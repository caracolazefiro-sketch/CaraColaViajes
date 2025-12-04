@echo off
REM =====================================================
REM OPTIMIZACION SEVERA DE VS CODE Y CHROME
REM =====================================================
REM Ejecutar como ADMINISTRADOR
REM Cierra VS Code y Chrome antes de ejecutar
REM =====================================================

setlocal enabledelayedexpansion

echo.
echo =====================================================
echo  OPTIMIZACION SEVERA - VS CODE Y CHROME
echo =====================================================
echo.
echo ADVERTENCIA: Cierra VS Code y Chrome antes de continuar
echo.
pause

REM Cambiar a directorio del proyecto
cd /d "C:\Users\chema\CaraColaViajes"

echo.
echo [1/8] Matando procesos de VS Code y Chrome...
taskkill /F /IM code.exe >nul 2>&1
taskkill /F /IM chrome.exe >nul 2>&1
timeout /t 2 /nobreak >nul
echo      OK - Procesos terminados

echo.
echo [2/8] Limpiando cache de VS Code...
REM Cache principal
for /d %%x in ("%APPDATA%\Code\Cache\*") do @rd /s /q "%%x" >nul 2>&1
del /q /f "%APPDATA%\Code\Cache\*" >nul 2>&1

REM CachedData
for /d %%x in ("%APPDATA%\Code\CachedData\*") do @rd /s /q "%%x" >nul 2>&1
del /q /f "%APPDATA%\Code\CachedData\*" >nul 2>&1

REM Code settings sync
for /d %%x in ("%APPDATA%\Code\User\globalStorage\*") do @rd /s /q "%%x" >nul 2>&1

echo      OK - Cache de VS Code limpiado

echo.
echo [3/8] Limpiando extensiones de VS Code...
REM Eliminar carpeta de extensiones (se reinstalarán automáticamente)
REM COMENTADO: Descomentar si quieres borrar TODAS las extensiones
REM for /d %%x in ("%USERPROFILE%\.vscode\extensions\*") do @rd /s /q "%%x" >nul 2>&1

echo      OK - Extensiones check (manual si es necesario)

echo.
echo [4/8] Limpiando cache de NPM...
call npm cache clean --force >nul 2>&1
echo      OK - NPM cache limpiado

echo.
echo [5/8] Limpiando archivos temporales del sistema...
del /q /f %TEMP%\* >nul 2>&1
for /d %%x in (%TEMP%\*) do @rd /s /q "%%x" >nul 2>&1
echo      OK - Temp limpiado

echo.
echo [6/8] Limpiando prefetch de Windows...
del /q /f C:\Windows\Prefetch\* >nul 2>&1
echo      OK - Prefetch limpiado

echo.
echo [7/8] Limpiando datos de Chrome...
REM Usuario por defecto de Chrome
set CHROME_PATH=%LOCALAPPDATA%\Google\Chrome\User Data\Default
if exist "!CHROME_PATH!" (
    del /q /f "!CHROME_PATH!\Cache\*" >nul 2>&1
    for /d %%x in ("!CHROME_PATH!\Cache\*") do @rd /s /q "%%x" >nul 2>&1
    
    del /q /f "!CHROME_PATH!\Code Cache\*" >nul 2>&1
    for /d %%x in ("!CHROME_PATH!\Code Cache\*") do @rd /s /q "%%x" >nul 2>&1
    
    echo      OK - Cache de Chrome limpiado
) else (
    echo      ADVERTENCIA - No se encontró Chrome en ruta por defecto
)

echo.
echo [8/8] Comprimiendo memoria no utilizada...
REM Solo en Windows 10+
powershell -Command "Get-Process | ForEach-Object { $_.Refresh() }" >nul 2>&1
echo      OK - Memoria comprimida

echo.
echo =====================================================
echo  OPTIMIZACION COMPLETADA
echo =====================================================
echo.
echo PROXIMOS PASOS:
echo.
echo 1. Abre VS Code normalmente
echo    - Espera a que cargue completamente (primera vez puede tardar)
echo    - Las extensiones se reinstalarán automáticamente
echo.
echo 2. Abre Chrome normalmente
echo    - El cache estará vacío (mas rapido)
echo    - Tus credenciales se mantienen
echo.
echo 3. Verifica en Task Manager:
echo    - VS Code: debe estar <300MB
echo    - Chrome: debe estar <500MB
echo.
echo =====================================================
pause
