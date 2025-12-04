# Screenshots Carmen - Test V0.7

**Fecha:** 04.12.2025
**Tester:** Carmen (CMSG)
**Documento origen:** `Test1- Test Results V0.8_04122025.docx`

---

## 📸 Capturas a extraer del documento

### Errores Críticos
- [ ] `error-ajustar-parada.png` - Error ZERO_RESULTS al usar botón "Ajustar Parada"
- [ ] `error-parada-intermedia.png` - Bejar no aparece en itinerario como parada intermedia
- [ ] `error-cantagallo-italia.png` - Error al añadir Cantagallo (2000km extra, no se puede eliminar)

### Mejoras UX
- [ ] `scroll-horizontal-resumen.png` - Vista general con scroll horizontal
- [ ] `datos-extraños-mapa.png` - Datos que no se entienden tras calcular itinerario
- [ ] `km-dia-sin-recuadro.png` - Campo KM/día sin borde delimitador
- [ ] `no-actualiza-desvio.png` - Mapa no actualiza KM al añadir gasolinera/restaurante
- [ ] `codigo-postal-innecesario.png` - Código postal en destino (06800 Mérida)

### Funcionalidad
- [ ] `parada-añadida-no-aparece.png` - Paradas añadidas no aparecen en frame superior
- [ ] `boton-mas-sin-menos.png` - Botón (+) sin botón (-) para restar días
- [ ] `fecha-regreso-no-actualiza.png` - Frame superior no actualiza al añadir días con (+)

---

## 🔧 Cómo extraer las imágenes del Word

**Método 1 - Windows Explorer:**
1. Renombra el .docx a .zip: `Test1- Test Results V0.8_04122025.zip`
2. Abre el .zip
3. Ve a `word/media/`
4. Copia todas las imágenes a esta carpeta
5. Renómbralas según la lista de arriba

**Método 2 - PowerShell:**
```powershell
# Crear copia temporal
Copy-Item "C:\Users\chema\CaraColaViajes\CHEMA\TESTING\Test1- Test Results V0.8_04122025.docx" "C:\Users\chema\CaraColaViajes\CHEMA\TESTING\temp.zip"

# Extraer (requiere 7-Zip o similar)
# Las imágenes estarán en word/media/
```

**Método 3 - Google Keep:**
Si guardaste en Keep, descarga desde Keep y cópialas aquí.

---

## ✅ Checklist

Una vez extraídas, marcar con [x] las capturas obtenidas y renombradas.
