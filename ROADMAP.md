# 🚀 ROADMAP - Prueba Técnica API de Productos

## ✅ FASE 1 COMPLETADA - Sistema de Autenticación y Usuarios

- [x] Modelo de Usuario con roles (admin, editor, provider)
- [x] Sistema JWT con tokens de 24h
- [x] Middleware de autenticación para GraphQL
- [x] Servicios de autenticación y gestión de usuarios
- [x] GraphQL mutations y queries para usuarios
- [x] Permisos por rol implementados
- [x] Seed de usuarios iniciales
- [x] Testing básico completado

### Usuarios de prueba disponibles:

- **Admin**: `admin@treew.com` / `admin123`
- **Editor**: `editor@test.com` / `editor123`
- **Provider**: `provider@test.com` / `provider123`

---

## 📋 FASE 2 - Estados de Producto y Flujo Editorial

### 🎯 Objetivo:

Implementar estados de productos (`pending`, `published`) y flujo de aprobación por roles.

### 📝 Tareas pendientes:

#### 1. **Actualizar modelo de Producto**

- [ ] Agregar campo `status: String` (pending, published)
- [ ] Agregar campo `createdBy: ObjectId` (referencia al usuario)
- [ ] Agregar campo `approvedBy: ObjectId` (referencia al editor/admin)
- [ ] Agregar campo `approvedAt: Date`
- [ ] Actualizar índices

#### 2. **Lógica de negocio por rol**

- [ ] **Provider crea producto** → Estado automático: `pending`
- [ ] **Editor/Admin crea producto** → Estado automático: `published`
- [ ] **Editor/Admin puede aprobar** → `pending` → `published`

#### 3. **Nuevas operaciones GraphQL**

- [ ] Mutation: `approveProduct(gtin: String!): Product`
- [ ] Query: `productsByStatus(status: String!): [Product]`
- [ ] Query: `pendingProducts: [Product]` (solo editor/admin)

#### 4. **Actualizar resolvers existentes**

- [ ] `createProduct` → Asignar status según rol del usuario
- [ ] `products` → Filtrar por status según rol (provider solo ve sus productos)
- [ ] `updateProduct` → Validar permisos según estado

#### 5. **Validaciones de permisos**

- [ ] Provider: Solo puede ver/editar productos `pending` propios
- [ ] Editor/Admin: Puede ver todos, aprobar, editar cualquiera
- [ ] Producto `published` solo editable por editor/admin

---

## 📋 FASE 3 - Auditoría de Cambios (Product History)

### 🎯 Objetivo:

Registrar automáticamente todos los cambios en productos.

### 📝 Tareas pendientes:

#### 1. **Mejorar modelo ProductHistory**

- [ ] Verificar que el modelo actual sea completo
- [ ] Agregar campos: `action` (created, updated, approved, deleted)
- [ ] Agregar `changedBy: ObjectId` (usuario que hizo el cambio)
- [ ] Agregar `changes: Object` (campos específicos que cambiaron)

#### 2. **Middleware de auditoría**

- [ ] Pre/post hooks en modelo Product
- [ ] Capturar automáticamente cambios en save/update
- [ ] Registrar usuario que hace el cambio

#### 3. **Queries de historial**

- [ ] Query: `productHistory(gtin: String!): [ProductHistory]`
- [ ] Incluir historial en query `product(gtin: String!)`

## 📋 FASE 4 - Mejoras Modelo GS1

### 🎯 Objetivo:

Verificar y completar cumplimiento del estándar GS1.

### 📝 Campos adicionales a considerar:

- [ ] `productCategory: String`
- [ ] `countryOfOrigin: String`
- [ ] `dimensions: Object` (length, width, height, unit)
- [ ] `allergenInformation: [String]`
- [ ] `nutritionalInformation: Object`
- [ ] Validaciones más estrictas de GTIN

---

## 📋 FASE 5 - Datos de Prueba y Testing

### 🎯 Objetivo:

Crear datos completos para demostración.

### 📝 Tareas pendientes:

#### 1. **Productos de ejemplo**

- [ ] Producto creado por provider (pending)
- [ ] Producto creado por editor (published)
- [ ] Producto con historial de cambios completo

#### 2. **Scenarios de testing**

- [ ] Provider crea → queda pending
- [ ] Editor aprueba → pasa a published
- [ ] Editor crea → queda published directamente
- [ ] Validar permisos en cada operación

#### 3. **Testing de búsqueda**

- [ ] Sincronización correcta en Elasticsearch
- [ ] Búsqueda por status
- [ ] Filtros por rol

---

## 📋 FASE 6 - Documentación y Reporte IA

### 🎯 Objetivo:

Completar entregables finales.

### 📝 Tareas pendientes:

#### 1. **README.md actualizado**

- [ ] Instrucciones de instalación
- [ ] Ejemplos de uso de todas las APIs
- [ ] Endpoints disponibles
- [ ] Usuarios de prueba

#### 2. **IA-report.md**

- [ ] Herramientas usadas (GitHub Copilot, etc.)
- [ ] Ejemplos de prompts clave
- [ ] Decisiones tomadas con IA
- [ ] Limitaciones encontradas
- [ ] Conclusiones sobre utilidad

#### 3. **Testing final**

- [ ] Postman collection completa
- [ ] Casos de uso documentados
- [ ] Verificación de todos los requisitos

---

## 🔧 CONSIDERACIONES TÉCNICAS

### Variables de entorno actuales:

```env
JWT_SECRET=treew-super-secret-jwt-key-2024
JWT_EXPIRES_IN=24h
BCRYPT_ROUNDS=12
NODE_ENV=development
```

### Puertos en uso:

- **Product Service**: 3000 (GraphQL)
- **Search Service**: 4002 (REST)
- **MongoDB**: 27017
- **Elasticsearch**: 9200
- **NATS**: 4222

### Estado actual de servicios:

- ✅ Product Service: Funcionando con autenticación
- ✅ Search Service: Funcionando con Elasticsearch
- ✅ MongoDB: Conectado con usuarios creados
- ✅ NATS: Funcionando para eventos
- ✅ Elasticsearch: Funcionando para búsquedas

---
