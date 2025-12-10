#!/usr/bin/env pwsh
<#
.SYNOPSIS
    Abre el Dashboard de Resultados del Test Real del Motor

.DESCRIPTION
    Este script abre automaticamente el archivo DASHBOARD_REAL_TEST_RESULTADOS.html
    en el navegador por defecto. Util para colaboradores que necesitan revisar
    los resultados del test real sin linea de comandos.

.EXAMPLE
    .\ABRIR_RESULTADOS_TEST.ps1

.AUTHOR
    CaraColaViajes Team

.DATE
    8 de Diciembre 2025
#>

# Obtener la ruta del directorio donde se ejecuta el script
$ScriptDir = Split-Path -Parent -Path $MyInvocation.MyCommand.Definition

# Construir la ruta completa del archivo HTML
$HtmlFile = Join-Path $ScriptDir "DASHBOARD_REAL_TEST_RESULTADOS.html"

# Verificar que el archivo existe
if (-not (Test-Path $HtmlFile)) {
    Write-Host "`n" -ForegroundColor Red
    Write-Host "========================================" -ForegroundColor Red
    Write-Host "ERROR: No se encuentra el archivo" -ForegroundColor Red
    Write-Host "========================================" -ForegroundColor Red
    Write-Host "`nRuta esperada:" -ForegroundColor Yellow
    Write-Host $HtmlFile -ForegroundColor Cyan
    Write-Host "`nPor favor verifica que el archivo existe en la carpeta del proyecto." -ForegroundColor Yellow
    Write-Host "`n"
    Read-Host "Presiona Enter para cerrar"
    exit 1
}

# Mostrar informacion
Write-Host "`n" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "ABRIENDO RESULTADOS DEL TEST REAL" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "`n"
Write-Host "Archivo: " -ForegroundColor Yellow -NoNewline
Write-Host "DASHBOARD_REAL_TEST_RESULTADOS.html" -ForegroundColor Cyan
Write-Host "`nUbicacion: " -ForegroundColor Yellow -NoNewline
Write-Host $ScriptDir -ForegroundColor Cyan
Write-Host "`n"

# Abrir el archivo en el navegador por defecto
try {
    Invoke-Item $HtmlFile
    Write-Host "✅ Dashboard abierto exitosamente" -ForegroundColor Green
    Write-Host "`n📊 El navegador se abrira en unos segundos..." -ForegroundColor Green
    Write-Host "   Si no se abre automaticamente, visita:" -ForegroundColor Yellow
    Write-Host "   file:///$($HtmlFile -replace '\\', '/')" -ForegroundColor Cyan
    Write-Host "`n"
}
catch {
    Write-Host "❌ Error al abrir el archivo:" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    Write-Host "`n"
    Read-Host "Presiona Enter para cerrar"
    exit 1
}
