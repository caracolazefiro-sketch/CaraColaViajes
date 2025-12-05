# GitHub Account Audit Report
**Fecha:** 2025-12-05T10:00:00.000Z  
**Usuario:** @caracolazefiro-sketch

---

## 1. Estado de Cuenta
```
@caracolazefiro-sketch (caracolazefiro-sketch)
- Profile: Datos editables desde https://github.com/settings/profile
- Plan: GitHub Free
- Copilot Pro: $10.00/mes (activo)
- 2FA Status: NO HABILITADO (⚠️ Recomendación: Habilitar)
- Profile picture: Configurado
- Bio: (vacío - oportunidad de completar)
- Location: (vacío)
- Company: (vacío)
- Social accounts: (vacío)
```

## 2. Billing y Plan
```
Suscripciones:
- GitHub Free: $0.00/mes
- Copilot Pro: $10.00/mes
  └─ Metered usage: $20.61 (diciembre 1-30)
  
Metered Usage Balance:
- Current included usage: $20.62
- Next payment due: (sin información)

Billable Usage (Actions & Runners):
- $0 Total billable usage (EXCELENTE)
- $0.02 consumed usage
- -$0.02 discounts (1:1 ratio)

Included Usage:
- Actions minutes: 0 min usado / 2000 min included
- Actions storage: 0 GB usado / 0,5 GB included
- Reset en: 27 días

Top Repository this month: CaraColaViajes (sin gastos)
```

## 3. API y Rate Limits
```json
{
  "resources": {
    "code_search": {
      "limit": 60,
      "remaining": 60,
      "reset": 1764927647,
      "used": 0,
      "resource": "code_search"
    },
    "core": {
      "limit": 60,
      "remaining": 60,
      "reset": 1764927647,
      "used": 0,
      "resource": "core"
    },
    "graphql": {
      "limit": 0,
      "remaining": 0,
      "reset": 1764927647,
      "used": 0,
      "resource": "graphql"
    },
    "integration_manifest": {
      "limit": 5000,
      "remaining": 5000,
      "reset": 1764927647,
      "used": 0,
      "resource": "integration_manifest"
    },
    "search": {
      "limit": 10,
      "remaining": 10,
      "reset": 1764924107,
      "used": 0,
      "resource": "search"
    }
  },
  "rate": {
    "limit": 60,
    "remaining": 60,
    "reset": 1764927647,
    "used": 0,
    "resource": "core"
  }
}
```

## 4. Estado del Repo
```
Repositorio: caracolazefiro-sketch/CaraColaViajes

Rama actual: testing (11 minutos con pushes recientes)

Commits recientes:
- 232a83b: refactor(github-audit): Cambiar a descarga local sin API
  └─ 5 minutos ago
- 04ab785: improve(actions): Mejorar reverse geocoding para ciudades importantes
  └─ 1 hora ago
- 4befce9: fix(page): Garantizar que startCoordinates siempre existe
  └─ 2 horas ago
- 22fb7af: debug(TripMap): Añadir log detallado del primer día
  └─ 2 horas ago

Estadísticas:
- TypeScript: 85.1%
- HTML: 12.6%
- JavaScript: 1.7%
- Other: 0.6%

Visibilidad: Public ✅
```

## 5. Deployments y Actions
```
Vercel Deployments Status: 633 deployments total

Production:
- Status: Deployed (completed)
- Last deployed: 5 días ago
- URL: https://cara-cola-viajes-4m4alv6aq-caracola.vercel.app

Preview Deployments (últimas 6 horas):
✅ feat(audit): Agregar GitHub Account Audit page
   - Deployed hace 11 minutos a testing branch
   
✅ improve(actions): Mejorar reverse geocoding
   - Deployed hace 1 hora
   
✅ fix(page): Garantizar que startCoordinates
   - Deployed hace 2 horas
   
✅ debug(TripMap): Añadir log detallado
   - Deployed hace 2 horas

❌ feat(debug): Transportar debugLogs del servidor al cliente
   - FAILED deployment hace 2 horas (problema de compilación)
   
✅ debug(actions): Añadir logs detallados
   - Deployed hace 2 horas

Conclusión: Sistema de CI/CD trabajando bien. Solo 1 fallo reciente (debugLogs).
```

## 6. Collaboradores y Acceso
```
Owner: @caracolazefiro-sketch
- Rol: Owner (control total)
- Permisos: Admin en repo

Collaborators: (a investigar en settings/access)
- Información no capturada en este audit

Invitaciones pendientes: (a investigar)
- Información no capturada en este audit

⚠️ NOTA: Para datos completos, visitar:
https://github.com/caracolazefiro-sketch/CaraColaViajes/settings/access
```

## 7. Seguridad
```
Cuenta Personal:

Sign-in Methods:
✅ Email: 1 verified email configured
✅ Password: Configured
✅ Passkeys: Available (biometrics or security keys)
✅ Google: 1 account connected
✅ Apple: Available

Two-Factor Authentication:
❌ NO HABILITADO (⚠️ CRÍTICO - Recomendación: Habilitar inmediatamente)

SSH Keys: (a verificar en https://github.com/settings/security)
Personal Access Tokens: (a verificar)

Recomendaciones de Seguridad:
1. 🔴 URGENTE: Habilitar 2FA (Two-Factor Authentication)
2. ⚠️ Revisar SSH keys activas
3. ⚠️ Auditar Personal Access Tokens (PATs)
4. 📋 Considerar usar Passkeys como método primario
```

## 8. Notas Adicionales
```
OBSERVACIONES GENERALES:

✅ Fortalezas:
- Cuenta Pro con Copilot habilitado
- CI/CD automatizado (Vercel) funcionando bien
- 0 gastos en Actions (repo público eficiente)
- Rate limits saludables (sin problemas de API)
- Actividad reciente (pushes hace minutos)

⚠️ Áreas de Mejora:
- 2FA NO habilitado (prioridad ALTA)
- Bio de perfil incompleta (oportunidad de networking)
- Metadata de perfil vacía (Location, Company, etc)
- Pendiente auditar SSH keys y tokens personales

🔧 Estado del Proyecto CaraColaViajes:
- 633 deployments totales
- Branch testing activo (11 minutos de última actividad)
- 3 commits principales hoy:
  1. Reverse geocoding mejorado (Places API)
  2. startCoordinates fix en page.tsx
  3. GitHub Audit page refactorizada (local download)
- 1 deployment fallido reciente (debugLogs - revisar)

📊 Métrica de Salud:
- Productividad: 🟢 Alta (múltiples commits)
- Seguridad: 🔴 Baja (2FA deshabilitado)
- Infraestructura: 🟢 Buena (Vercel + GitHub Actions)
- Plan financiero: 💰 Optimizado ($10/mes Copilot, 0 Actions)

Próximos Pasos Recomendados:
1. Habilitar 2FA en tu cuenta GitHub
2. Completar perfil público (bio, ubicación, empresa)
3. Auditar SSH keys y PATs en https://github.com/settings/security
4. Investigar fallo de deployment en commit 523f250 (debugLogs)
5. Testear en producción: Salamanca→Barcelona con fixes de markers
```

---
_Generado automáticamente por CaraColaViajes GitHub Audit_  
_Patrón: CHEMA/TESTING/GITHUB_AUDIT_YYYY-MM-DD.md_
