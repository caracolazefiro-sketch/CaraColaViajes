# Monitor de Cache de Geocoding
# Muestra cuando el archivo ha cambiado y cuantas ciudades hay

Write-Host ""
Write-Host "=== MONITOR DE CACHE GEOCODING ===" -ForegroundColor Cyan
Write-Host ""

$cacheFile = "data\geocoding-cache.json"

# 1. Verificar si el archivo existe
if (-not (Test-Path $cacheFile)) {
    Write-Host "ERROR: Archivo no encontrado: $cacheFile" -ForegroundColor Red
    exit 1
}

# 2. Contar ciudades actuales
$cache = Get-Content $cacheFile | ConvertFrom-Json
$ciudadesActuales = ($cache.PSObject.Properties | Measure-Object).Count

Write-Host "ESTADO ACTUAL:" -ForegroundColor Yellow
Write-Host "  Ciudades en cache: $ciudadesActuales" -ForegroundColor Green
Write-Host "  Ubicacion: $cacheFile"
Write-Host ""

# 3. Ver si Git detecto cambios
Write-Host "ESTADO EN GIT:" -ForegroundColor Yellow
$gitStatus = git status --porcelain $cacheFile

if ($gitStatus) {
    # Hay cambios
    Write-Host "  ARCHIVO MODIFICADO - Hay cambios sin commitear" -ForegroundColor Yellow
    Write-Host ""

    # Contar lineas anadidas (nuevas ciudades)
    $diff = git diff $cacheFile
    $lineasNuevas = ($diff | Select-String '^\+\s*"' | Measure-Object).Count
    $lineasBorradas = ($diff | Select-String '^\-\s*"' | Measure-Object).Count

    Write-Host "  + Entradas anadidas: ~$lineasNuevas" -ForegroundColor Green
    Write-Host "  - Entradas borradas: ~$lineasBorradas" -ForegroundColor Red
    Write-Host ""

    Write-Host "ACCION SUGERIDA:" -ForegroundColor Cyan
    Write-Host "  git add data\geocoding-cache.json" -ForegroundColor White
    Write-Host "  git commit -m 'chore: update geocoding cache'" -ForegroundColor White
    Write-Host "  git push origin testing" -ForegroundColor White
} else {
    # No hay cambios
    Write-Host "  SINCRONIZADO - Sin cambios pendientes" -ForegroundColor Green
    Write-Host ""

    # Mostrar ultimo commit
    Write-Host "ULTIMO COMMIT:" -ForegroundColor Yellow
    $ultimoCommit = git log --oneline -1 -- $cacheFile
    if ($ultimoCommit) {
        Write-Host "  $ultimoCommit" -ForegroundColor Gray
    } else {
        Write-Host "  (sin historial)" -ForegroundColor Gray
    }
}

Write-Host ""
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""
