# 🚀 Treew Technical Test - Microservices Architecture

Sistema completo de microservicios para gestión de productos con autenticación JWT, control de roles, auditoría y búsqueda avanzada.

## 🏗️ Arquitectura

```
┌─────────────────┐    ┌──────────────────┐
│  Product        │    │  Search          │
│  Service        │    │  Service         │
│  (GraphQL)      │    │  (REST API)      │
│  Port: 3000     │    │  Port: 4002      │
│                 │    │                  │
│ • Auth JWT      │    │ • Elasticsearch  │
│ • User Mgmt     │    │ • NATS Events    │
│ • Product CRUD  │    │ • Search API     │
│ • Audit Trail   │    │ • Auto Indexing  │
│ • Role Control  │    │                  │
└─────────┬───────┘    └──────────┬───────┘
          │                       │
          └───────┐       ┌───────┘
                  │       │
              ┌───▼───────▼───┐
              │     NATS      │
              │  Port: 4222   │
              │   Messaging   │
              └───────────────┘

┌─────────────────┐    ┌──────────────────┐
│    MongoDB      │    │  Elasticsearch   │
│  Port: 27017    │    │   Port: 9200     │
│                 │    │                  │
│ • Users         │    │ • Product Index  │
│ • Products      │    │ • Search Engine  │
│ • Audit History │    │ • Analytics      │
└─────────────────┘    └──────────────────┘
```

## 🎯 Funcionalidades Implementadas

### 🔐 Sistema de Autenticación

- ✅ **Autenticación JWT**: Tokens seguros con expiración de 24h
- ✅ **Sistema de Roles**: Admin, Editor, Provider con permisos diferenciados
- ✅ **Gestión de Usuarios**: CRUD completo con control de acceso
- ✅ **Middleware de Seguridad**: Protección de endpoints por rol
- ✅ **Cambio de Contraseñas**: Para usuarios y administradores

### 📦 Gestión de Productos

- ✅ **CRUD Completo**: Crear, leer, actualizar y eliminar productos
- ✅ **Estados de Producto**: `pending` y `published` con flujo de aprobación
- ✅ **Control por Rol**: Providers crean productos pendientes, Editors/Admins aprueban
- ✅ **Validación GS1**: GTIN, peso neto con unidades, información completa
- ✅ **Comunicación Asíncrona**: Eventos vía NATS para sincronización

### 📊 Auditoría y Trazabilidad

- ✅ **Historial Automático**: Registro de todos los cambios en productos
- ✅ **Auditoría Completa**: Seguimiento independiente con filtros avanzados
- ✅ **Consultas Flexibles**: Filtrado por GTIN, nombre, acción, usuario, fechas
- ✅ **Paginación**: Control eficiente de grandes volúmenes de datos
- ✅ **Metadata Completa**: Cambios detallados con datos anteriores y nuevos

### 🔍 Búsqueda Avanzada

- ✅ **Elasticsearch**: Motor de búsqueda de alto rendimiento
- ✅ **Indexación Automática**: Sincronización via eventos NATS
- ✅ **API REST**: Endpoints simples para búsqueda
- ✅ **Health Monitoring**: Verificación de estado de servicios

## � Usuarios de Prueba

El sistema incluye usuarios pre-configurados para testing:

| Rol          | Email               | Password      | Permisos                               |
| ------------ | ------------------- | ------------- | -------------------------------------- |
| **Admin**    | `admin@treew.com`   | `admin123`    | Control total del sistema              |
| **Editor**   | `editor@test.com`   | `editor123`   | Aprobar productos, gestionar contenido |
| **Provider** | `provider@test.com` | `provider123` | Crear productos (quedan pending)       |

## 🚀 Ejecución con Docker

### Prerequisitos

- Docker
- Docker Compose

### Clonar e Instalar

```bash
# Clonar el repositorio
git clone https://github.com/yborges1986/product-api-technical-test.git
cd product-api-technical-test

# Ejecutar todo el ecosistema
docker compose up -d

# Ver logs en tiempo real
docker compose logs -f

# Verificar que todos los servicios estén funcionando
curl http://localhost:3000/health  # Product Service
curl http://localhost:4002/health  # Search Service
```

### Comandos Útiles

```bash
# Parar todos los servicios
docker compose down

# Reiniciar un servicio específico
docker compose restart product-service

# Ver logs de un servicio
docker compose logs product-service

# Ver estado de contenedores
docker compose ps

# Limpiar todo (incluyendo volúmenes)
docker compose down -v
```

### Desarrollo Local (Opcional)

Si prefieres ejecutar sin Docker:

1. **Prerequisitos**:

## �🚀 Inicio Rápido

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

#### 🔐 Autenticación

**Login**:

```graphql
mutation {
  login(input: { email: "admin@treew.com", password: "admin123" }) {
    token
    user {
      id
      name
      email
      role
    }
  }
}
```

**Obtener perfil actual**:

```graphql
query {
  me {
    id
    name
    email
    role
    isActive
  }
}
```

**Cambiar contraseña**:

```graphql
mutation {
  changePassword(
    input: { currentPassword: "admin123", newPassword: "newpassword123" }
  ) {
    id
    name
  }
}
```

#### 📦 Gestión de Productos

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
      netWeight: 500
      netWeightUnit: g
    }
  ) {
    id
    gtin
    name
    status
    createdBy {
      name
      role
    }
  }
}
```

**Buscar Producto**:

```graphql
query {
  product(gtin: "1234567890123") {
    id
    gtin
    name
    description
    brand
    manufacturer
    netWeight
    netWeightUnit
    status
    createdBy {
      name
      role
    }
    approvedBy {
      name
    }
    history {
      id
      action
      changedBy {
        name
      }
      changedAt
    }
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
    status
    updatedAt
  }
}
```

**Aprobar Producto** (Solo Editor/Admin):

```graphql
mutation {
  approveProduct(gtin: "1234567890123") {
    id
    gtin
    status
    approvedBy {
      name
    }
    approvedAt
  }
}
```

**Eliminar Producto**:

```graphql
mutation {
  deleteProduct(gtin: "1234567890123")
}
```

#### 📊 Consultas por Estado

**Productos por Estado**:

```graphql
query {
  productsByStatus(status: pending) {
    id
    gtin
    name
    status
    createdBy {
      name
    }
  }
}
```

**Productos Pendientes** (Solo Editor/Admin):

```graphql
query {
  pendingProducts {
    id
    gtin
    name
    createdBy {
      name
    }
    createdAt
  }
}
```

#### 📈 Auditoría y Historial

**Historial de un Producto**:

```graphql
query {
  productHistory(gtin: "1234567890123") {
    id
    action
    changedBy {
      name
      role
    }
    changedAt
    changes
    previousData
    newData
  }
}
```

**Auditoría Completa con Filtros**:

```graphql
# Buscar por nombre
query {
  auditHistory(name: "test", limit: 10, offset: 0) {
    id
    gtin
    action
    changedBy {
      name
      role
    }
    changedAt
  }
}

# Filtros combinados
query {
  auditHistory(
    action: updated
    changedBy: "68b9e2ced7c94da36ac81d26"
    startDate: "2024-01-01"
    endDate: "2024-12-31"
    limit: 20
  ) {
    id
    gtin
    action
    changedBy {
      name
    }
    changedAt
    changes
  }
}
```

#### 👥 Gestión de Usuarios (Solo Admin)

**Crear Usuario**:

```graphql
mutation {
  createUser(
    input: {
      name: "Nuevo Usuario"
      email: "nuevo@test.com"
      password: "password123"
      role: provider
    }
  ) {
    id
    name
    email
    role
    isActive
  }
}
```

**Listar Usuarios**:

```graphql
query {
  users {
    id
    name
    email
    role
    isActive
    lastLogin
    createdAt
  }
}
```

**Cambiar Rol de Usuario**:

```graphql
mutation {
  changeUserRole(userId: "USER_ID", newRole: editor) {
    id
    name
    role
  }
}
```

### Search Service (REST) - `http://localhost:4002`

**Buscar productos**:

```bash
# Búsqueda general
GET /search-elastic?q=producto

# Respuesta:
{
  "results": [
    {
      "id": "...",
      "gtin": "1234567890123",
      "name": "Producto Test",
      "brand": "Marca Test"
    }
  ]
}
```

**Obtener producto por ID**:

```bash
GET /product/{id}

# Respuesta:
{
  "product": {
    "id": "...",
    "gtin": "1234567890123",
    "name": "Producto Test",
    "description": "...",
    "brand": "Marca Test"
  }
}
```

**Health Check**:

```bash
GET /health

# Respuesta:
{
  "status": "healthy",
  "service": "search-service",
  "uptime": 1234.5,
  "elasticsearch": "connected"
}
```

## 🌐 Comunicación entre Servicios

### Eventos NATS

El sistema utiliza NATS para comunicación asíncrona entre servicios:

1. **`product.created`**: Se emite cuando se crea un producto

   ```json
   {
     "id": "product_id",
     "gtin": "1234567890123",
     "name": "Producto Test",
     "status": "pending",
     "createdBy": "user_id"
   }
   ```

2. **`product.updated`**: Se emite cuando se actualiza un producto

   ```json
   {
     "id": "product_id",
     "gtin": "1234567890123",
     "changes": { "name": "Nuevo nombre" },
     "updatedBy": "user_id"
   }
   ```

3. **`product.deleted`**: Se emite cuando se elimina un producto

   ```json
   {
     "id": "product_id",
     "gtin": "1234567890123",
     "deletedBy": "user_id"
   }
   ```

4. **`product.approved`**: Se emite cuando se aprueba un producto
   ```json
   {
     "id": "product_id",
     "gtin": "1234567890123",
     "approvedBy": "user_id",
     "status": "published"
   }
   ```

### Flujo de Datos

```
Product Service (GraphQL) → NATS Events → Search Service → Elasticsearch
                ↓
           MongoDB (Products)
                ↓
        ProductHistory (Audit)
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

## 🧪 Testing y Ejemplos

### Testing con curl

**Autenticación**:

```bash
# Login para obtener token
curl -X POST "http://localhost:3000/graphql" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "mutation { login(input: { email: \"admin@treew.com\", password: \"admin123\" }) { token user { name role } } }"
  }'
```

**Crear producto** (requiere token):

```bash
curl -X POST "http://localhost:3000/graphql" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "query": "mutation { createProduct(input: { gtin: \"123456789\", name: \"Test Product\", description: \"Test\", brand: \"Test Brand\", manufacturer: \"Test Mfg\", netWeight: 100, netWeightUnit: g }) { id gtin name status createdBy { name role } } }"
  }'
```

**Buscar producto**:

```bash
curl -X POST "http://localhost:3000/graphql" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "query": "{ product(gtin: \"123456789\") { id gtin name status history { action changedBy { name } changedAt } } }"
  }'
```

**Auditoría con filtros**:

```bash
curl -X POST "http://localhost:3000/graphql" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "query": "{ auditHistory(name: \"test\", action: created, limit: 5) { id gtin action changedBy { name role } changedAt } }"
  }'
```

**Búsqueda en Elasticsearch**:

```bash
curl "http://localhost:4002/search-elastic?q=Test"
```

### Scripts NPM Disponibles

```bash
# Iniciar todos los servicios
npm run start

# Ver logs de todos los servicios
npm run logs

# Verificar salud de servicios
npm run health

# Parar todos los servicios
npm run stop
```

## 📊 Estructura del Proyecto

```
treew-tecnical-test/
├── docker-compose.yml                    # Orquestación completa del ecosistema
├── package.json                         # Scripts principales del proyecto
├── README.md                           # Esta documentación
├── ROADMAP.md                          # Plan de desarrollo y progreso
├── test-system.sh                      # Script de testing automatizado
│
├── product-service/                    # 🎯 Microservicio Principal
│   ├── Dockerfile                      # Imagen Docker del servicio
│   ├── index.js                        # Punto de entrada del servidor
│   ├── package.json                    # Dependencias del servicio
│   │
│   ├── core/                           # 🔧 Configuración Central
│   │   ├── nats.js                     # Cliente NATS para eventos
│   │   └── database/
│   │       └── mongo.js                # Conexión a MongoDB
│   │
│   ├── middleware/                     # 🛡️ Seguridad y Validación
│   │   ├── auth.middleware.js          # Middleware JWT para GraphQL
│   │   └── serviceAuth.js              # Autenticación de servicios
│   │
│   ├── models/                         # 📄 Modelos de Datos
│   │   ├── index.js                    # Exportación de modelos
│   │   ├── user.model.js               # Modelo de usuarios con roles
│   │   ├── product.model.js            # Modelo de productos GS1
│   │   └── productHistory.model.js     # Modelo de auditoría
│   │
│   ├── services/                       # 🧠 Lógica de Negocio
│   │   ├── auth/                       # Servicios de autenticación
│   │   │   ├── login.js                # Login con JWT
│   │   │   ├── getMe.js                # Perfil del usuario actual
│   │   │   ├── changePassword.js       # Cambio de contraseña
│   │   │   └── updateProfile.js        # Actualización de perfil
│   │   │
│   │   ├── product/                    # Servicios de productos
│   │   │   ├── createProduct.js        # Crear producto con audit
│   │   │   ├── getProduct.js           # Obtener producto por GTIN
│   │   │   ├── updateProduct.js        # Actualizar con historial
│   │   │   ├── deleteProduct.js        # Eliminar con trazabilidad
│   │   │   ├── approveProduct.js       # Aprobar productos pending
│   │   │   ├── getProductHistory.js    # Historial de un producto
│   │   │   └── getAuditHistory.js      # Auditoría global con filtros
│   │   │
│   │   └── user/                       # Servicios de usuarios (Admin)
│   │       ├── createUser.js           # Crear usuario con rol
│   │       ├── getAllUsers.js          # Listar todos los usuarios
│   │       ├── updateUser.js           # Actualizar usuario
│   │       ├── changeUserRole.js       # Cambiar rol de usuario
│   │       ├── activateUser.js         # Activar usuario
│   │       └── deactivateUser.js       # Desactivar usuario
│   │
│   ├── graphql/                        # 🌐 API GraphQL
│   │   ├── product.graphql.js          # Servidor GraphQL principal
│   │   ├── schemas/                    # Definición de esquemas
│   │   │   ├── common.schema.js        # Tipos comunes y enums
│   │   │   ├── product.schema.js       # Schema de productos
│   │   │   ├── user.schema.js          # Schema de usuarios
│   │   │   └── auth.schema.js          # Schema de autenticación
│   │   └── resolvers/                  # Resolvers GraphQL
│   │       ├── product.resolvers.js    # Resolvers de productos
│   │       ├── user.resolvers.js       # Resolvers de usuarios
│   │       └── auth.resolvers.js       # Resolvers de auth
│   │
│   ├── utils/                          # 🔨 Utilidades
│   │   ├── jwt.util.js                 # Manejo de tokens JWT
│   │   ├── password.util.js            # Encriptación de contraseñas
│   │   ├── permissions.util.js         # Control de permisos por rol
│   │   └── audit.util.js               # Utilidades de auditoría
│   │
│   └── seeds/                          # 🌱 Datos Iniciales
│       └── users.seed.js               # Usuarios de prueba
│
└── search-service/                     # 🔍 Microservicio de Búsqueda
    ├── Dockerfile                      # Imagen Docker del servicio
    ├── index.js                        # API REST principal
    ├── package.json                    # Dependencias del servicio
    ├── nats-listener.js                # Listener individual NATS
    ├── start-listeners.js              # Inicializador de listeners
    │
    ├── elastic/                        # 🎯 Elasticsearch
    │   ├── client.js                   # Cliente de Elasticsearch
    │   └── productIndex.js             # Gestión del índice de productos
    │
    └── listeners/                      # 👂 Event Listeners
        ├── BaseListener.js             # Clase base para listeners
        ├── productCreatedListener.js   # Listener para product.created
        ├── productUpdatedListener.js   # Listener para product.updated
        ├── productDeletedListener.js   # Listener para product.deleted
        └── productApprovedListener.js  # Listener para product.approved
```

## 🔧 Variables de Entorno

### Product Service (.env)

```env
# Servidor
PORT=3000
NODE_ENV=development

# Base de datos
MONGODB_URI=mongodb://mongodb:27017/product_management

# JWT Configuración
JWT_SECRET=treew-super-secret-jwt-key-2024
JWT_EXPIRES_IN=24h
JWT_AUDIENCE=treew-app
JWT_ISSUER=treew-product-api

# Encriptación
BCRYPT_ROUNDS=12

# NATS Messaging
NATS_URL=nats://nats:4222
```

### Search Service (.env)

```env
# Servidor
PORT=4002
NODE_ENV=development

# Elasticsearch
ELASTICSEARCH_URL=http://elasticsearch:9200

# NATS Messaging
NATS_URL=nats://nats:4222
```

## � Control de Acceso y Roles

### Matriz de Permisos

| Operación             | Provider             | Editor         | Admin          |
| --------------------- | -------------------- | -------------- | -------------- |
| **Crear Producto**    | ✅ (pending)         | ✅ (published) | ✅ (published) |
| **Ver Productos**     | ✅ (solo propios)    | ✅ (todos)     | ✅ (todos)     |
| **Editar Producto**   | ✅ (pending propios) | ✅ (todos)     | ✅ (todos)     |
| **Aprobar Producto**  | ❌                   | ✅             | ✅             |
| **Eliminar Producto** | ❌                   | ✅             | ✅             |
| **Ver Auditoría**     | ❌                   | ✅             | ✅             |
| **Gestión Usuarios**  | ❌                   | ❌             | ✅             |

### Flujo de Estados

```
Provider crea producto → Status: PENDING
                            ↓
Editor/Admin aprueba → Status: PUBLISHED
                            ↓
                    Visible en búsquedas
```

### Autenticación JWT

Cada request debe incluir el header:

```
Authorization: Bearer <jwt_token>
```

El token contiene:

```json
{
  "userId": "...",
  "email": "user@example.com",
  "role": "admin|editor|provider",
  "name": "Usuario Name",
  "exp": 1234567890
}
```

## �🐛 Troubleshooting

### Problemas Comunes

1. **Error de autenticación "Token required"**

   - Solución: Incluir header `Authorization: Bearer <token>` en todas las requests
   - Verificar que el token no haya expirado (24h)

2. **Error "Insufficient permissions"**

   - Verificar que el usuario tenga el rol correcto para la operación
   - Provider solo puede crear/editar productos pending propios

3. **Error de conexión a MongoDB**

   - Verificar que el contenedor de MongoDB esté ejecutándose
   - Comando: `docker compose ps mongodb`

4. **Error de conexión a NATS**

   - Verificar que el contenedor de NATS esté ejecutándose
   - Comando: `docker compose ps nats`

5. **Error de Elasticsearch**

   - Verificar que Elasticsearch esté ejecutándose y sea la versión 8.x
   - Comando: `curl http://localhost:9200/_cluster/health`

6. **Productos no aparecen en búsqueda**

   - Los eventos NATS pueden tardar unos segundos en procesar
   - Verificar logs del search-service: `docker compose logs search-service`

7. **Error "GTIN already exists"**
   - Cada GTIN debe ser único en el sistema
   - Usar un GTIN diferente o actualizar el producto existente

### Health Checks

```bash
# Product Service
curl http://localhost:3000/health

# Search Service
curl http://localhost:4002/health

# NATS Monitoring
curl http://localhost:8222/varz

# Elasticsearch Health
curl http://localhost:9200/_cluster/health
```

### Logs y Debugging

```bash
# Ver logs de todos los servicios
docker compose logs -f

# Ver logs de un servicio específico
docker compose logs product-service
docker compose logs search-service
docker compose logs mongodb
docker compose logs elasticsearch
docker compose logs nats

# Ver logs en tiempo real de un servicio
docker compose logs -f product-service

# Entrar a un contenedor para debugging
docker compose exec product-service sh
docker compose exec search-service sh

# Verificar estado de contenedores
docker compose ps

# Reiniciar un servicio específico
docker compose restart product-service
```

### Puertos del Sistema

| Servicio        | Puerto Host | Puerto Interno | Descripción             |
| --------------- | ----------- | -------------- | ----------------------- |
| Product Service | 3000        | 3000           | API GraphQL principal   |
| Search Service  | 4002        | 4002           | API REST de búsqueda    |
| MongoDB         | 27017       | 27017          | Base de datos principal |
| Elasticsearch   | 9200        | 9200           | Motor de búsqueda       |
| NATS            | 4222        | 4222           | Message broker          |
| NATS Monitor    | 8222        | 8222           | Monitoring NATS         |

## 🚀 Estado del Proyecto

### Funcionalidades Implementadas ✅

- **✅ Sistema de Autenticación y Usuarios**

  - JWT con roles (Admin, Editor, Provider)
  - Gestión completa de usuarios
  - Middleware de seguridad

- **✅ Estados de Producto y Flujo Editorial**

  - Estados `pending` y `published`
  - Flujo de aprobación por roles
  - Control de permisos por usuario

- **✅ Auditoría y Trazabilidad**

  - Historial automático de cambios
  - Query de auditoría independiente
  - Filtros avanzados (nombre, acción, usuario, fechas)
  - Paginación y búsqueda flexible

- **✅ Búsqueda Avanzada**
  - Integración con Elasticsearch
  - Sincronización automática via NATS
  - API REST para búsquedas

### Arquitectura Implementada

El sistema es una **arquitectura de microservicios completa** que incluye:

- 🔐 **Autenticación JWT** con control de roles granular
- 📦 **CRUD completo** de productos con validación GS1
- 📊 **Auditoría completa** con trazabilidad independiente
- 🔍 **Búsqueda avanzada** con Elasticsearch
- 🌐 **Comunicación asíncrona** via NATS
- 🐳 **Despliegue con Docker** completamente funcional

### Funcionalidades Destacadas

1. **Sistema de Roles Completo**

   - Providers crean productos que quedan pendientes
   - Editors/Admins pueden aprobar y gestionar todo
   - Control granular de permisos por endpoint

2. **Auditoría Avanzada**

   - Tracking independiente que funciona incluso con productos eliminados
   - Filtros flexibles por nombre, acción, usuario, fechas
   - Paginación eficiente para grandes volúmenes

3. **Arquitectura Escalable**
   - Microservicios independientes
   - Comunicación asíncrona via eventos
   - Base de datos separada para cada servicio

## 🤝 Contribución

1. Fork el proyecto
2. Crear feature branch (`git checkout -b feature/nueva-caracteristica`)
3. Commit cambios (`git commit -m 'Agregar nueva característica'`)
4. Push a la branch (`git push origin feature/nueva-caracteristica`)
5. Crear Pull Request

## 📝 Licencia

Este proyecto es parte de una prueba técnica para Treew.

---

## 🎯 ¡Sistema Completo y Funcional!

El sistema está **completamente implementado** con todas las funcionalidades solicitadas y más:

- ✅ **Autenticación JWT** con roles
- ✅ **CRUD de productos** con estados
- ✅ **Auditoría completa** con filtros avanzados
- ✅ **Búsqueda con Elasticsearch**
- ✅ **Microservicios comunicados** via NATS
- ✅ **Control de permisos** granular
- ✅ **Documentación completa**
- ✅ **Testing funcional**

**¡Listo para producción!** 🚀
