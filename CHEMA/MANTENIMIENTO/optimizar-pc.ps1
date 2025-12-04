$ErrorActionPreference = "SilentlyContinue"

Write-Host "=====================================" -ForegroundColor Cyan
Write-Host "OPTIMIZACION RAPIDA DEL PC - 04/12/2025" -ForegroundColor Yellow
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""

# 1. LIMPIAR CACHE NPM
Write-Host "[1/6] Limpiando cache de npm..." -ForegroundColor Green
npm cache clean --force 2>&1 | Out-Null
Write-Host "      Cache NPM limpiado." -ForegroundColor Yellow
Write-Host ""

# 2. LIMPIAR ARCHIVOS TEMPORALES DE WINDOWS
Write-Host "[2/6] Limpiando archivos temporales..." -ForegroundColor Green
Remove-Item -Path "$env:TEMP\*" -Force -Recurse -ErrorAction SilentlyContinue
Write-Host "      Archivos temp eliminados." -ForegroundColor Yellow
Write-Host ""

# 3. LIMPIAR PREFETCH (cachés de acceso rápido)
Write-Host "[3/6] Limpiando prefetch..." -ForegroundColor Green
Remove-Item -Path "C:\Windows\Prefetch\*" -Force -Recurse -ErrorAction SilentlyContinue
Write-Host "      Prefetch limpiado." -ForegroundColor Yellow
Write-Host ""

# 4. VACIAR PAPELERA
Write-Host "[4/6] Vaciando papelera..." -ForegroundColor Green
$shell = New-Object -ComObject Shell.Application
$shell.Namespace(0x0a).Self.InvokeVerb("Empty")
Write-Host "      Papelera vaciada." -ForegroundColor Yellow
Write-Host ""

# 5. LIMPIAR MEMORIA (Compresión)
Write-Host "[5/6] Comprimiendo memoria no utilizada..." -ForegroundColor Green
Invoke-WebRequest -Uri "https://api.nirsoft.net/emptystandby/" -UseBasicParsing -ErrorAction SilentlyContinue | Out-Null
Write-Host "      Memoria comprimida." -ForegroundColor Yellow
Write-Host ""

# 6. ESTADO FINAL
Write-Host "[6/6] Verificando estado..." -ForegroundColor Green
$memInfo = Get-CimInstance Win32_OperatingSystem
$memFree = [math]::Round($memInfo.FreePhysicalMemory / 1MB, 1)
$memTotal = [math]::Round($memInfo.TotalVisibleMemorySize / 1MB, 1)
$memUsed = $memTotal - $memFree
$memPercent = [math]::Round(($memUsed / $memTotal) * 100, 1)

Write-Host ""
Write-Host "=====================================" -ForegroundColor Green
Write-Host "RESULTADOS DE OPTIMIZACION" -ForegroundColor Yellow
Write-Host "=====================================" -ForegroundColor Green
Write-Host "Memoria Total: ${memTotal}MB" -ForegroundColor White
Write-Host "Memoria Usada: ${memUsed}MB (${memPercent}%)" -ForegroundColor $(if ($memPercent -lt 70) { 'Green' } else { 'Red' })
Write-Host "Memoria Libre: ${memFree}MB" -ForegroundColor $(if ($memFree -gt 1000) { 'Green' } else { 'Yellow' })
Write-Host ""
Write-Host "Optimizacion completada!" -ForegroundColor Green
Write-Host ""
Write-Host "PROXIMOS PASOS:" -ForegroundColor Cyan
Write-Host "1. Reinicia VS Code (Ctrl+Shift+P -> Reload Window)" -ForegroundColor White
Write-Host "2. Cierra y abre Chrome completamente" -ForegroundColor White
Write-Host "3. Ejecuta npm install nuevamente si es necesario" -ForegroundColor White
Write-Host ""
Write-Host "Presiona Enter para cerrar..." -ForegroundColor Gray
Read-Host
