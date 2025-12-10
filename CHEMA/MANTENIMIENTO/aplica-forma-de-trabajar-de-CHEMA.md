# Aplica forma de trabajar de CHEMA

Objetivo: asegurar cambios mínimos, reversibles y con permiso explícito.

- Principios
  - Pedir permiso explícito antes de modificar archivos.
  - Explicar el plan (qué, por qué, impacto) y los comandos.
  - Cambios centrados en la causa raíz, evitando refactors amplios.
  - Verificar y reportar estado tras cada acción (server, pruebas, UI).

- Pasos típicos
  1. Confirmar versión activa y componentes implicados (p.ej., `app/motor/page.tsx`).
  2. Proponer cambio mínimo (imports, helper puntual) y esperar “OK”.
  3. Ejecutar comandos con rutas claras y dejar trazabilidad.
  4. Validar: arrancar servidor, abrir URL, comprobar logs/errores.
  5. Si algo falla, revertir rápido (p.ej., `git restore <archivo>`).

- Ejemplo aplicado (08/12/2025)
  - Activar V1.4: actualizar imports en `app/motor/page.tsx` a `ESTABLE_V1.4_08DEC25_1458`.
  - Arranque Next en Windows: mover backups `ESTABLE_*` a `CHEMA/MANTENIMIENTO/LEGACY_MOTOR/` para evitar rutas largas.
  - Corregir fecha `NaN/NaN/NaN`: parche en `calculateDynamicDate` con fallback a `state.fecha` y formato `DD/MM/YYYY`.
  - Cerrar sesiones PowerShell no esenciales y reiniciar dev limpio.

## Registro de cambios (fecha y hora)

- 08/12/2025, 19:18 (Europa/Madrid)
  - Crear backup completo: ESTABLE_V1.4.RECUPERADO_08DEC1913 con todos los archivos de motor/ (hooks, components, styles, types, actions)
  - Comandos ejecutados: N/A
  - Reversión rápida: N/A


- 08/12/2025, 18:57 (Europa/Madrid)
  - Activar V1.3: actualizar imports en page.tsx y agregar badge visual
  - Comandos ejecutados: N/A
  - Reversión rápida: N/A


- 08/12/2025, 18:39 (Europa/Madrid)
  - Reinicio del servidor dev tras apuntar vista activa a V1.3
  - Comandos ejecutados: N/A
  - Reversión rápida: N/A


- 08/12/2025, 18:36 (Europa/Madrid)
  - Apuntar vista activa a V1.3 original: actualizar imports en app/motor/page.tsx
  - Comandos ejecutados: N/A
  - Reversión rápida: N/A


- 08/12/2025, 18:20 (Europa/Madrid)
  - Bypass componentes V1.3 corruptos: usar componentes V1.4 en page.tsx (mantener useMotor V1.3)
  - Comandos ejecutados: N/A
  - Reversión rápida: N/A


- 08/12/2025, 18:16 (Europa/Madrid)
  - Componentes V1.3 restaurados: MotorComparisonMaps/MotorItinerary/MotorSearch reemplazados por versiones válidas
  - Comandos ejecutados: N/A
  - Reversión rápida: N/A


- 08/12/2025, 18:15 (Europa/Madrid)
  - Reemplazar V1.3 componentes corruptos (MotorComparisonMaps, MotorItinerary, MotorSearch) con versiones V1.4
  - Comandos ejecutados: N/A
  - Reversión rápida: N/A


- 08/12/2025, 18:09 (Europa/Madrid)
  - Reinicio servidor dev para confirmar /motor con imports V1.3
  - Comandos ejecutados: N/A
  - Reversión rápida: N/A


- 08/12/2025, 18:08 (Europa/Madrid)
  - Imports en page.tsx apuntan a ESTABLE_V1.3_07DEC25_1102 (componentes y hook useMotor)
  - Comandos ejecutados: N/A
  - Reversión rápida: N/A


- 08/12/2025, 17:59 (Europa/Madrid)
  - Cerrar instancia previa de next dev para liberar lock
  - Comandos ejecutados: N/A
  - Reversión rápida: N/A


- 08/12/2025, 17:59 (Europa/Madrid)
  - Corregido import de CSS: usar ESTABLE_V1.4_08DEC25_1458/styles/motor.css
  - Comandos ejecutados: N/A
  - Reversión rápida: N/A


- 08/12/2025, 17:56 (Europa/Madrid)
  - Relanzar servidor dev para verificar /motor tras corrección de imports
  - Comandos ejecutados: N/A
  - Reversión rápida: N/A


- 08/12/2025, 17:48 (Europa/Madrid)
  - Verificación runtime de /motor con ESTABLE_V1.4_08DEC25_1458 anidado
  - Comandos ejecutados: N/A
  - Reversión rápida: N/A


- 08/12/2025, 17:46 (Europa/Madrid)
  - Recuperar configuración exacta de ESTABLE_V1.4_08DEC25_1458/ESTABLE_V1.4_08DEC25_1458 en app/motor/page.tsx
  - Comandos ejecutados: N/A
  - Reversión rápida: N/A


- 08/12/2025, 17:42 (Europa/Madrid)
  - Cambio: Consulta de cambios desde 15:00 en V1.4 carpeta
  - Comandos ejecutados:
    Comandos:\ngit log --oneline --since=" 2025-12-08 15:00:00\
  - Reversión rápida:
    --


- 2025-12-08 17:05 (Europa/Madrid)
  - Cambio: Activar V1.4 en `/motor` (ajuste de imports en `app/motor/page.tsx`).
  - Comandos: N/A (edición de código).
  - Reversión rápida: `git restore app/motor/page.tsx`.

- 2025-12-08 17:18 (Europa/Madrid)
  - Cambio: Mover backups `ESTABLE_*` fuera de `app/motor` a `CHEMA/MANTENIMIENTO/LEGACY_MOTOR/`.
  - Comandos ejecutados:
    ```powershell
    New-Item -ItemType Directory -Force "CHEMA\MANTENIMIENTO\LEGACY_MOTOR"
    Move-Item "app\motor\ESTABLE_V1.2_*" "CHEMA\MANTENIMIENTO\LEGACY_MOTOR\" -Force
    Move-Item "app\motor\ESTABLE_V1.3_*" "CHEMA\MANTENIMIENTO\LEGACY_MOTOR\" -Force
    Move-Item "app\motor\ESTABLE_V1_06DEC*" "CHEMA\MANTENIMIENTO\LEGACY_MOTOR\" -Force
    ```
  - Reversión rápida:
    ```powershell
    Move-Item "CHEMA\MANTENIMIENTO\LEGACY_MOTOR\ESTABLE_*" "app\motor\" -Force
    ```

- 2025-12-08 17:25 (Europa/Madrid)
  - Cambio: Parche `calculateDynamicDate` para evitar `NaN/NaN/NaN` y formatear `DD/MM/YYYY`.
  - Archivo: `app/motor/page.tsx`.
  - Reversión rápida: `git restore app/motor/page.tsx`.

## Plantilla para nuevos cambios

- [AAAA-MM-DD HH:MM] (Zona horaria)
  - Cambio: descripción breve + archivo(s) afectados.
  - Comandos ejecutados: bloque PowerShell (si aplica).
  - Reversión rápida: comando(s) `git restore` o `Move-Item` inverso.


- Comandos de referencia
```powershell
# Mover backups fuera de app/motor
New-Item -ItemType Directory -Force "CHEMA\MANTENIMIENTO\LEGACY_MOTOR"
Move-Item "app\motor\ESTABLE_V1.2_*" "CHEMA\MANTENIMIENTO\LEGACY_MOTOR\" -Force
Move-Item "app\motor\ESTABLE_V1.3_*" "CHEMA\MANTENIMIENTO\LEGACY_MOTOR\" -Force
Move-Item "app\motor\ESTABLE_V1_06DEC*" "CHEMA\MANTENIMIENTO\LEGACY_MOTOR\" -Force

# Reinicio dev
Get-Process node | Stop-Process -Force; Start-Sleep -Seconds 1
npx next dev -p 3000
```

- Reversión rápida
```powershell
git restore app/motor/page.tsx
```

- Nota
  - No borrar backups; mantenerlos fuera de `app/` para evitar que Next/Turbopack los indexe.
