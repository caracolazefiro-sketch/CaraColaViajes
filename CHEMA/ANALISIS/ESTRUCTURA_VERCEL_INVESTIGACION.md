# Investigación: Estructura de Vercel & Ramas de Deploy

## 🔍 Situación Actual (10 DIC 2025)

### Proyectos Vercel Detectados
```
1. cara-cola-viajes (ID: 5J2sRbc4p)
   - URL: https://cara-cola-viajes-{hash}.vercel.app
   - Rama: testing
   - Status: Desplegando con cada push

2. cara-cola-viajes-pruebas (ID: 8vYz1d7Ce)
   - URL: https://cara-cola-viajes-pruebas-{hash}.vercel.app
   - Rama: testing
   - Status: Desplegando con cada push
```

**Problema:** Ambos proyectos están conectados a la MISMA rama (testing) → 2 deploys por cada push

---

## 📊 Ramas Git en el Repositorio

```
LOCAL:
  * testing (rama actual)
    main
    motor-mvp
    preview
    preview-1500
    preview-stable
    refactor/reorganize-structure

REMOTE (origin):
  HEAD -> origin/main
  origin/main
  origin/motor-mvp
  origin/preview-1500
  origin/preview-stable
  origin/testing
```

### Análisis de Ramas:
- **main** → Producción real (desplegada en Vercel principal)
- **testing** → Rama de pruebas (AQUÍ ESTAMOS AHORA)
- **preview*** → Otras ramas de preview antiguas
- **motor-mvp** → Rama para features

---

## ⚙️ Configuración Vercel (vercel.json)

```json
{
  "git": {
    "deploymentEnabled": {
      "main": false,
      "testing": true,      // ← Testing branch HABILITADA
      "pruebas": false      // ← Rama "pruebas" no existe
    }
  }
}
```

### Lo que significa:
- ✅ Cuando hagas push a `testing` → Desplegar automáticamente
- ❌ Cuando hagas push a `main` → NO desplegar (probablemente se despliega manualmente)
- ❌ `pruebas` es un nombre fantasma (no existe rama con ese nombre)

---

## 🚀 Cómo Vercel Funciona

### Concepto 1: Proyectos vs Ramas
```
UN PROYECTO Vercel = UN repositorio GitHub + configuración
UNA RAMA Git = Diferentes versiones del código

Pero:
- Puedes conectar MÚLTIPLES proyectos Vercel al MISMO repositorio
- Cada proyecto puede estar configurado para desplegar ramas diferentes
```

### Concepto 2: Webhook de GitHub
```
Cuando haces push a GitHub:
1. GitHub envía un webhook a Vercel
2. Vercel recibe la notificación del push
3. Vercel revisa vercel.json y su configuración
4. Si el deployment está habilitado para esa rama → DESPLIEGA
```

---

## 🔴 Por Qué Tenemos 2 Deploys

### Escenario Probable:

En algún momento, alguien creó **dos proyectos separados en Vercel**:

```
Proyecto 1: cara-cola-viajes
  - Conectado a: caracolazefiro-sketch/CaraColaViajes
  - Configurado para: rama "testing" (probablemente manual)

Proyecto 2: cara-cola-viajes-pruebas
  - Conectado a: caracolazefiro-sketch/CaraColaViajes
  - Configurado para: rama "testing" (probablemente manual)
```

Ambos escuchan el **mismo webhook de GitHub**, así que:
- Push a `testing`
  → GitHub envía webhook a Vercel
  → Proyecto 1 lo recibe: "Ah, testing cambió, déjame desplegar"
  → Proyecto 2 lo recibe: "Ah, testing cambió, déjame desplegar"
  → **2 DEPLOYS**

---

## ✅ Soluciones Posibles

### Opción A: Usar Vercel.json (LO QUE INTENTAMOS)
```json
{
  "git": {
    "deploymentEnabled": {
      "testing": true      // Solo proyecto conectado debe desplegar
    }
  }
}
```
❌ **Problema:** vercel.json aplica a AMBOS proyectos. Si ambos tienen webhook, ambos despliegan.

### Opción B: Eliminar uno de los Proyectos (RECOMENDADO)
```
1. Ir a https://vercel.com/caracolazefiro-sketch
2. Seleccionar "cara-cola-viajes" (el que no quieres)
3. Settings → General → Delete Project (al final)
4. Confirmar eliminación
```
✅ **Resultado:** Solo quedará `cara-cola-viajes-pruebas` desplegando

### Opción C: Usar Ramas Diferentes
```
Proyecto 1 (cara-cola-viajes) → rama main (producción)
Proyecto 2 (cara-cola-viajes-pruebas) → rama testing (pruebas)

vercel.json:
{
  "git": {
    "deploymentEnabled": {
      "main": true,      // Para proyecto 1
      "testing": true    // Para proyecto 2
    }
  }
}
```
✅ **Resultado:** Cada proyecto despliega su rama, sin conflictos

---

## 📋 Histórico de Cambios Hoy

```
Commit 1: 5fbce37 - feat: Add server start button to /search
Commit 2: 64fb328 - fix: Disable testing branch deploy, keep only pruebas
  ❌ Problema: Deshabilitó testing, habilitó "pruebas" (rama fantasma)

Commit 3: e335cda - feat: Add offline server startup landing page
  → Debería desplegar a ambos (pero no desplegaba a ninguno)

Commit 4: 0e20bc6 - fix: Enable testing branch deploy in Vercel
  ✅ Habilitó testing nuevamente
  → Ahora ambos proyectos despliegan (2 deploys)
```

---

## 🎯 MI RECOMENDACIÓN

**Opción B es la más limpia:**

1. Vete a https://vercel.com/caracolazefiro-sketch
2. Abre el proyecto **"cara-cola-viajes"** (5J2sRbc4p)
3. Ve a Settings → General
4. Desplázate al final → Haz clic en **"Delete Project"**
5. Confirma
6. Resultado: Solo `cara-cola-viajes-pruebas` desplegará a testing

---

## 🔐 Alternativa Si Necesitas Ambos Proyectos

Si tienes razón de tener 2 proyectos (ej: dos clientes, dos dominios):

**Solución:** Desconectar uno del GitHub webhook

```
1. En Vercel, abre cara-cola-viajes
2. Settings → Git Integrations
3. Busca "caracolazefiro-sketch/CaraColaViajes"
4. Haz clic en "Disconnect"
5. Reconnect a una rama DIFERENTE (ej: main)
```

Pero esto requiere acceso directo a Vercel (necesitamos credenciales).

---

## 📝 Resumen para el Usuario

| Concepto | Explicación |
|----------|------------|
| **Proyecto Vercel** | Un deployment independiente en vercel.com |
| **Rama Git** | Una versión del código en GitHub |
| **Webhook** | Notificación automática de GitHub a Vercel |
| **vercel.json** | Configura TODAS las ramas para un proyecto (no distingue entre varios) |
| **Tu situación** | 2 proyectos Vercel escuchan cambios a la rama testing |
| **Solución fácil** | Eliminar 1 proyecto en Vercel (no afecta GitHub ni vercel.json) |

---

## ✨ Próximos Pasos

1. **Tu tarea:** Elimina uno de los proyectos en Vercel (Settings → Delete)
2. **Mi tarea:** Verificar que solo despliega 1 proyecto en el siguiente push
3. **Resultado final:** 1 deploy por push en rama testing
