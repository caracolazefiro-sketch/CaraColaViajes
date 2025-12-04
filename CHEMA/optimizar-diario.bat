@echo off
REM Script de Optimizacion Rapida - Ejecutar diariamente
REM Haz click derecho -> "Ejecutar como administrador"

echo =====================================
echo  OPTIMIZACION DIARIA DEL PC
echo =====================================
echo.

REM 1. Limpiar cache npm
echo [1/5] Limpiando cache NPM...
cd /d C:\Users\chema\CaraColaViajes
call npm cache clean --force >nul 2>&1
echo      OK - Cache NPM limpiado

REM 2. Limpiar temp
echo [2/5] Limpiando archivos temporales...
for /d %%x in (%temp%\*) do @rd /s /q "%%x" >nul 2>&1
del /q /f %temp%\* >nul 2>&1
echo      OK - Temp limpiado

REM 3. Limpiar prefetch
echo [3/5] Limpiando prefetch...
del /q /f C:\Windows\Prefetch\* >nul 2>&1
echo      OK - Prefetch limpiado

REM 4. Vaciar papelera
echo [4/5] Vaciando papelera...
for /f %%A in ('wmic logicaldisk get name ^| findstr ":"') do (
    del /q /f /s "%%A\$Recycle.bin\*" >nul 2>&1
)
echo      OK - Papelera vaciada

REM 5. Limpiar DNS cache
echo [5/5] Limpiando DNS cache...
ipconfig /flushdns >nul 2>&1
echo      OK - DNS limpiado

echo.
echo =====================================
echo  OPTIMIZACION COMPLETADA!
echo =====================================
echo.
echo Memoria: Ver en Task Manager
echo.
pause
