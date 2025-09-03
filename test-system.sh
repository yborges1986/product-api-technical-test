#!/bin/bash

echo "🚀 Verificando el sistema completo..."
echo ""

# Verificar si Docker Compose está ejecutándose
echo "📋 1. Verificando servicios Docker..."
docker compose ps

echo ""
echo "🏥 2. Verificando health checks..."

# Health check Product Service
echo "   - Product Service (Puerto 3000):"
curl -s http://localhost:3000/health | jq . 2>/dev/null || echo "   ❌ No disponible"

echo ""
echo "   - Search Service (Puerto 4002):"
curl -s http://localhost:4002/health | jq . 2>/dev/null || echo "   ❌ No disponible"

echo ""
echo "🧪 3. Prueba completa del sistema..."

# Crear un producto de prueba
echo "   - Creando producto de prueba..."
RESPONSE=$(curl -s -X POST http://localhost:3000/graphql \
  -H "Content-Type: application/json" \
  -d '{
    "query": "mutation { createProduct(input: { gtin: \"TEST-'$(date +%s)'\", name: \"Producto Test\", description: \"Test automatizado\", brand: \"TestBrand\", manufacturer: \"TestCorp\", netWeight: \"1kg\" }) { id gtin name } }"
  }')

if [[ $RESPONSE == *"errors"* ]]; then
    echo "   ❌ Error al crear producto"
    echo "   Response: $RESPONSE"
else
    echo "   ✅ Producto creado exitosamente"
    
    # Esperar para indexación
    echo "   - Esperando indexación en Elasticsearch..."
    sleep 3
    
    # Buscar el producto
    echo "   - Buscando productos..."
    SEARCH_RESPONSE=$(curl -s "http://localhost:4002/search-elastic?q=Test")
    
    if [[ $SEARCH_RESPONSE == *"results"* ]]; then
        echo "   ✅ Búsqueda funcionando correctamente"
    else
        echo "   ❌ Error en búsqueda"
        echo "   Response: $SEARCH_RESPONSE"
    fi
fi

echo ""
echo "🎯 4. URLs disponibles:"
echo "   - Product Service (GraphQL): http://localhost:3000/graphql"
echo "   - Search Service (REST): http://localhost:4002/search-elastic"
echo "   - Product Health: http://localhost:3000/health"
echo "   - Search Health: http://localhost:4002/health"
echo "   - NATS Monitor: http://localhost:8222"

echo ""
echo "✅ Verificación completa!"
