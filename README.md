# 🚀 Treew Technical Test - Microservices Architecture

Sistema de microservicios para gestión de productos con arquitectura basada en eventos.

## 🏗️ Arquitectura

```
┌─────────────────┐    ┌──────────────────┐
│  Product        │    │  Search          │
│  Service        │    │  Service         │
│  (GraphQL)      │    │  (REST API)      │
│  Port: 3000     │    │  Port: 4002      │
└─────────┬───────┘    └──────────┬───────┘
          │                       │
          └───────┐       ┌───────┘
                  │       │
              ┌───▼───────▼───┐
              │     NATS      │
              │  Port: 4222   │
              └───────────────┘

┌─────────────────┐    ┌──────────────────┐
│    MongoDB      │    │  Elasticsearch   │
│  Port: 27017    │    │   Port: 9200     │
└─────────────────┘    └──────────────────┘
```

## 🎯 Funcionalidades

### Product Service (GraphQL)

- ✅ CRUD completo de productos
- ✅ Historial de cambios automático
- ✅ Rollback manual en errores
- ✅ Comunicación asíncrona vía NATS
- ✅ Health checks

### Search Service (REST)

- ✅ Búsqueda avanzada con Elasticsearch
- ✅ Listeners NATS para sincronización
- ✅ Indexación automática de productos
- ✅ API REST simple

## 🚀 Inicio Rápido

### Con Docker (Recomendado)

```bash
# Clonar el repositorio
git clone <repo-url>
cd treew-tecnical-test

# Ejecutar todo el ecosistema
npm run start
# o también: docker compose up -d

# Ver logs
npm run logs
# o también: docker compose logs -f

# Parar servicios
npm run stop

# Verificar salud
npm run health
```

### Desarrollo Local

1. **Prerequisitos**:

   - Node.js 18+
   - MongoDB
   - Elasticsearch 7.x
   - NATS Server

2. **Configurar servicios de infraestructura**:

   ```bash
   # MongoDB
   mongod --dbpath ./data/db

   # Elasticsearch
   elasticsearch

   # NATS
   nats-server -js
   ```

3. **Ejecutar Product Service**:

   ```bash
   cd product-service
   npm install
   cp .env.example .env
   npm run dev
   ```

4. **Ejecutar Search Service**:
   ```bash
   cd search-service
   npm install
   cp .env.example .env
   npm run dev
   ```

## 🔌 API Endpoints

### Product Service (GraphQL) - `http://localhost:3000/graphql`

**Crear Producto**:

```graphql
mutation {
  createProduct(
    input: {
      gtin: "1234567890123"
      name: "Producto Test"
      description: "Descripción del producto"
      brand: "Marca Test"
      manufacturer: "Fabricante Test"
      netWeight: "500g"
    }
  ) {
    id
    gtin
    name
    brand
  }
}
```

**Buscar Producto**:

```graphql
query {
  getProduct(gtin: "1234567890123") {
    id
    gtin
    name
    description
    brand
    manufacturer
    netWeight
  }
}
```

**Actualizar Producto**:

```graphql
mutation {
  updateProduct(
    gtin: "1234567890123"
    input: { name: "Producto Actualizado" }
  ) {
    id
    name
  }
}
```

**Eliminar Producto**:

```graphql
mutation {
  deleteProduct(gtin: "1234567890123")
}
```

### Search Service (REST) - `http://localhost:4002`

**Buscar productos**:

```bash
GET /search-elastic?q=producto
```

**Obtener producto por ID**:

```bash
GET /product/{id}
```

**Health Check**:

```bash
GET /health
```

## 🌐 Comunicación entre Servicios

### Eventos NATS

1. **`product.created`**: Emitido cuando se crea un producto
2. **`product.updated`**: Emitido cuando se actualiza un producto
3. **`product.deleted`**: Emitido cuando se elimina un producto

### Flujo de Datos

```
Product Service → NATS → Search Service → Elasticsearch
```

## 🏥 Monitoreo

### Health Checks

```bash
# Product Service
curl http://localhost:3000/health

# Search Service
curl http://localhost:4002/health

# NATS Monitoring
curl http://localhost:8222/varz
```

## 🧪 Testing

```bash
# Crear un producto de prueba
npm run test:create

# Buscar productos
npm run test:search

# Health checks
npm run health

# Testing manual con curl
# Crear un producto
curl -X POST http://localhost:3000/graphql \
  -H "Content-Type: application/json" \
  -d '{
    "query": "mutation { createProduct(input: { gtin: \"123\", name: \"Test\" }) { id name } }"
  }'

# Buscar en Elasticsearch
curl http://localhost:4002/search-elastic?q=Test
```

## 📊 Estructura del Proyecto

```
treew-tecnical-test/
├── docker-compose.yml          # Orquestación completa
├── package.json               # Scripts principales
├── product-service/           # Microservicio de productos
│   ├── core/                 # Configuración de DB y NATS
│   ├── models/               # Modelos de datos
│   ├── service/              # Lógica de negocio
│   ├── graphql/              # Schema GraphQL
│   └── Dockerfile
└── search-service/            # Microservicio de búsqueda
    ├── elastic/              # Cliente Elasticsearch
    ├── listeners/            # Listeners NATS
    └── Dockerfile
```

## 🔧 Variables de Entorno

### Product Service

```env
PORT=3000
MONGODB_URI=mongodb://localhost:27017/product_management
NODE_ENV=development
NATS_URL=nats://localhost:4222
```

### Search Service

```env
PORT=4002
NODE_ENV=development
NATS_URL=nats://localhost:4222
ELASTICSEARCH_URL=http://localhost:9200
```

## 🐛 Troubleshooting

### Problemas Comunes

1. **Error de conexión a MongoDB**: Verificar que MongoDB esté ejecutándose
2. **Error de conexión a NATS**: Verificar que NATS Server esté ejecutándose
3. **Error de Elasticsearch**: Verificar que Elasticsearch esté ejecutándose y sea la versión 7.x

### Logs

```bash
# Ver logs de servicios
docker-compose logs product-service
docker-compose logs search-service

# Ver logs en tiempo real
docker-compose logs -f
```

## 🤝 Contribución

1. Fork el proyecto
2. Crear feature branch (`git checkout -b feature/nueva-caracteristica`)
3. Commit cambios (`git commit -m 'Agregar nueva característica'`)
4. Push a la branch (`git push origin feature/nueva-caracteristica`)
5. Crear Pull Request

## 📝 Licencia

Este proyecto es parte de una prueba técnica para Treew.

---

## 🚀 ¡Listo para usar!

El sistema está completamente funcional y listo para desarrollo o producción.
