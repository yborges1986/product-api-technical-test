# 🛍️ Product Management Service

Microservicio de gestión de productos con GraphQL para operaciones CRUD y seguimiento de historial de cambios.

## 🚀 Características

- ✅ CRUD completo de productos
- 📊 Historial de cambios automático
- 🔄 Rollback manual en caso de errores
- 🩺 Health checks integrados
- 📈 Logging estructurado
- 🐳 Containerizado con Docker

## 🏗️ Arquitectura de Microservicios

Este servicio está diseñado para trabajar en una arquitectura de microservicios:

- **Puerto por defecto**: 3000
- **API**: GraphQL en `/graphql`
- **Health Check**: `/health`
- **Base de datos**: MongoDB independiente

## 📋 Requisitos

- Node.js 18+
- MongoDB 4.0+
- npm o yarn

## 🛠️ Instalación y Configuración

### Desarrollo Local

1. **Clonar y configurar**:

   ```bash
   npm install
   cp .env.example .env
   # Editar .env con tu configuración
   ```

2. **Ejecutar**:
   ```bash
   npm run devproducthistories
   ```

### Con Docker

1. **Ejecutar con docker-compose**:
   ```bash
   docker-compose up -d
   ```

## 🔌 API Endpoints

### GraphQL Operations

**Crear Producto**:

```graphql
mutation {
  createProduct(
    input: {
      gtin: "1234567890123"
      name: "Producto Ejemplo"
      description: "Descripción del producto"
      brand: "Marca"
      manufacturer: "Fabricante"
      netWeight: "500g"
    }
  ) {
    id
    gtin
    name
  }
}
```

**Obtener Producto**:

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
    input: { name: "Producto Actualizado", description: "Nueva descripción" }
  ) {
    id
    name
    description
  }
}
```

**Eliminar Producto**:

```graphql
mutation {
  deleteProduct(gtin: "1234567890123")
}
```

### REST Endpoints

- `GET /health` - Health check del servicio
- `GET /` - Información del servicio

## 🏥 Monitoreo

### Health Check

```bash
curl http://localhost:3000/health
```

Respuesta:

```json
{
  "service": "Product Management Service",
  "status": "healthy",
  "timestamp": "2025-09-02T10:30:00.000Z",
  "version": "1.0.0",
  "uptime": 3600
}
```

## 🔄 Integración con otros Microservicios

Este servicio puede integrarse con:

- **Search Service**: Para búsquedas avanzadas de productos
- **Inventory Service**: Para gestión de stock
- **User Service**: Para autenticación
- **Notification Service**: Para notificaciones de cambios

### Comunicación entre servicios

Usa las siguientes variables de entorno para configurar URLs de otros servicios:

```env
SEARCH_SERVICE_URL=http://search-service:3001
INVENTORY_SERVICE_URL=http://inventory-service:3002
```

## 🧪 Testing

```bash
# Ejecutar tests
npm test

# Health check script
npm run health
```

## 📊 Estructura del Proyecto

```
product-management-service/
├── core/
│   └── database/          # Configuración de MongoDB
├── models/                # Modelos de datos
├── service/               # Lógica de negocio
├── graphql/               # Schema y resolvers GraphQL
├── Dockerfile
├── docker-compose.yml
└── package.json
```

## 🚢 Deployment

### Variables de Entorno Requeridas

```env
PORT=3000
MONGODB_URI=mongodb://mongo:27017/product_management
NODE_ENV=production
```

### Con Docker

```bash
docker build -t product-management-service .
docker run -p 3000:3000 -e MONGODB_URI=... product-management-service
```

## 📝 Logs

El servicio usa Winston para logging estructurado:

- Logs de HTTP con Morgan
- Logs de aplicación con Winston
- Logs de errores GraphQL

## 🤝 Contribución

1. Fork el proyecto
2. Crear feature branch
3. Commit cambios
4. Push a la branch
5. Crear Pull Request
