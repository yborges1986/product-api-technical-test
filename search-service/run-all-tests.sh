#!/bin/bash

# Script para ejecutar todos los tests del search-service
echo "🧪 Ejecutando tests del Search Service..."

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Función para mostrar separador
show_separator() {
    echo -e "${YELLOW}================================================${NC}"
}

# Función para mostrar header de sección
show_header() {
    echo -e "${YELLOW}$1${NC}"
    show_separator
}

show_header "SEARCH SERVICE - EJECUTANDO TESTS"

# Verificar que estamos en el directorio correcto
if [ ! -f "package.json" ]; then
    echo -e "${RED}❌ Error: No se encuentra package.json. Ejecuta este script desde el directorio search-service.${NC}"
    exit 1
fi

# Verificar que node_modules existe
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}📦 Instalando dependencias...${NC}"
    npm install
fi

# Ejecutar todos los tests
show_header "EJECUTANDO TODOS LOS TESTS"
npm test
TEST_EXIT_CODE=$?

if [ $TEST_EXIT_CODE -ne 0 ]; then
    echo -e "${RED}❌ Algunos tests fallaron${NC}"
    exit 1
fi



# Mostrar resumen
echo -e "${YELLOW}📊 RESUMEN:${NC}"
echo "• Tests básicos: ✅"
echo "• Tests de API: ✅"
echo "• Tests utilitarios: ✅"

