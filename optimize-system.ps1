# Script PowerShell para optimizar Windows para desarrollo con pocos recursos
# Ejecutar como Administrador

Write-Host "Optimizando sistema para desarrollo..." -ForegroundColor Green

# Detener servicios innecesarios temporalmente
$servicesToStop = @(
    "SysMain",           # Superfetch
    "WSearch",           # Windows Search
    "DiagTrack",         # Telemetría
    "HomeGroupListener", # Grupo Hogar
    "HomeGroupProvider"  # Grupo Hogar Provider
)

foreach ($service in $servicesToStop) {
    $svc = Get-Service -Name $service -ErrorAction SilentlyContinue
    if ($svc -and $svc.Status -eq 'Running') {
        Write-Host "Deteniendo servicio: $service" -ForegroundColor Yellow
        Stop-Service -Name $service -Force -ErrorAction SilentlyContinue
    }
}

# Aumentar prioridad de proceso para VSCode y Chrome
$processes = @("Code", "chrome")
foreach ($procName in $processes) {
    $procs = Get-Process -Name $procName -ErrorAction SilentlyContinue
    if ($procs) {
        foreach ($proc in $procs) {
            $proc.PriorityClass = "High"
            Write-Host "Prioridad aumentada para: $procName (PID: $($proc.Id))" -ForegroundColor Green
        }
    }
}

# Limpiar memoria
Write-Host "Liberando memoria..." -ForegroundColor Yellow
[System.GC]::Collect()
[System.GC]::WaitForPendingFinalizers()

Write-Host "`nOptimización completada!" -ForegroundColor Green
Write-Host "Nota: Algunos servicios se detendrán solo temporalmente." -ForegroundColor Cyan
