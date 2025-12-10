#!/bin/bash

# Script para abrir el Dashboard de Resultados del Test Real
# Funciona en Mac y Linux
#
# Uso: ./ABRIR_RESULTADOS_TEST.sh
# O con permisos: chmod +x ABRIR_RESULTADOS_TEST.sh && ./ABRIR_RESULTADOS_TEST.sh

# Colores para salida
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Obtener el directorio donde se ejecuta el script
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

# Construir la ruta completa del archivo HTML
HTML_FILE="$SCRIPT_DIR/DASHBOARD_REAL_TEST_RESULTADOS.html"

# Verificar que el archivo existe
if [ ! -f "$HTML_FILE" ]; then
    echo ""
    echo -e "${RED}========================================${NC}"
    echo -e "${RED}ERROR: No se encuentra el archivo${NC}"
    echo -e "${RED}========================================${NC}"
    echo ""
    echo -e "${YELLOW}Ruta esperada:${NC}"
    echo -e "${CYAN}$HTML_FILE${NC}"
    echo ""
    echo -e "${YELLOW}Por favor verifica que el archivo existe en la carpeta del proyecto.${NC}"
    echo ""
    exit 1
fi

# Mostrar información
echo ""
echo -e "${CYAN}========================================${NC}"
echo -e "${CYAN}ABRIENDO RESULTADOS DEL TEST REAL${NC}"
echo -e "${CYAN}========================================${NC}"
echo ""
echo -e "${YELLOW}Archivo:${NC} ${CYAN}DASHBOARD_REAL_TEST_RESULTADOS.html${NC}"
echo -e "${YELLOW}Ubicacion:${NC} ${CYAN}$SCRIPT_DIR${NC}"
echo ""

# Detectar el sistema operativo y abrir el archivo
if [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS
    open "$HTML_FILE"
    open_status=$?
elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
    # Linux
    if command -v xdg-open &> /dev/null; then
        xdg-open "$HTML_FILE"
        open_status=$?
    elif command -v gnome-open &> /dev/null; then
        gnome-open "$HTML_FILE"
        open_status=$?
    elif command -v firefox &> /dev/null; then
        firefox "$HTML_FILE" &
        open_status=$?
    else
        echo -e "${YELLOW}No se encontró navegador compatible${NC}"
        open_status=1
    fi
else
    echo -e "${RED}Sistema operativo no reconocido${NC}"
    open_status=1
fi

# Mostrar resultado
if [ $open_status -eq 0 ]; then
    echo -e "${GREEN}✅ Dashboard abierto exitosamente${NC}"
    echo ""
    echo -e "${GREEN}📊 El navegador se abrira en unos segundos...${NC}"
    echo -e "${YELLOW}Si no se abre automaticamente, visita:${NC}"
    echo -e "${CYAN}file://$HTML_FILE${NC}"
    echo ""
else
    echo -e "${RED}❌ Error al abrir el archivo${NC}"
    echo -e "${YELLOW}Intenta abrirlo manualmente visitando:${NC}"
    echo -e "${CYAN}file://$HTML_FILE${NC}"
    echo ""
    exit 1
fi
