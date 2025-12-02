# Scripts de CaraColaViajes

## 📤 sync-roadmap.js

Script para sincronizar automáticamente el archivo `ROADMAP.md` con la base de datos Supabase.

### Uso

```bash
npm run sync-roadmap
```

### ¿Cuándo ejecutarlo?

Ejecuta este script **cada vez que actualices `ROADMAP.md`** para que los cambios se reflejen en la web `/roadmap`.

**Workflow recomendado:**

1. Editar `ROADMAP.md` localmente
2. Ejecutar `npm run sync-roadmap`
3. Commit y push:
   ```bash
   git add ROADMAP.md
   git commit -m "docs: Actualizar ROADMAP"
   git push
   ```

### Requisitos

El script necesita las siguientes variables de entorno (en `.env.local`):

```env
NEXT_PUBLIC_SUPABASE_URL=tu_url_de_supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_anon_key
```

### Funcionamiento

1. Lee el contenido completo de `ROADMAP.md`
2. Se conecta a Supabase usando la API REST
3. Actualiza el registro `id='main'` en la tabla `roadmap`
4. Si no existe, lo crea automáticamente

### Troubleshooting

**Error: Faltan variables de entorno**
- Asegúrate de tener `.env.local` con las variables de Supabase
- Copia `.env.local.example` si no lo tienes

**Error 401: Unauthorized**
- Verifica que las credenciales de Supabase sean correctas
- Comprueba que la tabla `roadmap` tenga políticas RLS configuradas

**Error: No se encontró ROADMAP.md**
- Ejecuta el script desde la raíz del proyecto
- O usa `npm run sync-roadmap`

### Automatización futura

En el futuro se podría automatizar con:
- Git hook pre-commit que detecte cambios en ROADMAP.md
- GitHub Action que sincronice automáticamente al hacer push
- Script en `postbuild` para sincronizar antes de deployar

---

## Otros scripts

(Documentar aquí futuros scripts según se vayan añadiendo)
