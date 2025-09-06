import mongoose from 'mongoose';

const productHistorySchema = new mongoose.Schema(
  {
    // Referencia al producto usando GTIN (más útil para consultas)
    gtin: {
      type: String,
      required: true,
      index: true,
    },
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
    },
    // Acción realizada en el producto
    action: {
      type: String,
      enum: ['created', 'updated', 'approved', 'deleted'],
      required: true,
    },
    // Usuario que realizó el cambio
    changedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    // Timestamp del cambio
    changedAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
    // Campos específicos que cambiaron (para updates)
    changes: {
      type: Object,
      default: null,
      // Estructura: { field: { from: oldValue, to: newValue } }
    },
    // Datos anteriores completos del producto
    previousData: {
      type: Object,
      default: null,
    },
    // Datos nuevos completos del producto
    newData: {
      type: Object,
      default: null,
    },
    // Metadatos adicionales
    metadata: {
      userAgent: String,
      ipAddress: String,
      source: {
        type: String,
        default: 'graphql-api',
      },
    },
  },
  {
    toJSON: {
      transform: function (doc, ret) {
        ret.id = ret._id.toString();
        delete ret._id;
        delete ret.__v;

        // Convertir objetos a JSON strings para GraphQL
        if (ret.changes && typeof ret.changes === 'object') {
          ret.changes = JSON.stringify(ret.changes);
        }
        if (ret.previousData && typeof ret.previousData === 'object') {
          ret.previousData = JSON.stringify(ret.previousData);
        }
        if (ret.newData && typeof ret.newData === 'object') {
          ret.newData = JSON.stringify(ret.newData);
        }
        if (ret.metadata && typeof ret.metadata === 'object') {
          ret.metadata = JSON.stringify(ret.metadata);
        }

        return ret;
      },
    },
    toObject: {
      transform: function (doc, ret) {
        ret.id = ret._id.toString();
        delete ret._id;
        delete ret.__v;

        // Convertir objetos a JSON strings para consistencia
        if (ret.changes && typeof ret.changes === 'object') {
          ret.changes = JSON.stringify(ret.changes);
        }
        if (ret.previousData && typeof ret.previousData === 'object') {
          ret.previousData = JSON.stringify(ret.previousData);
        }
        if (ret.newData && typeof ret.newData === 'object') {
          ret.newData = JSON.stringify(ret.newData);
        }
        if (ret.metadata && typeof ret.metadata === 'object') {
          ret.metadata = JSON.stringify(ret.metadata);
        }

        return ret;
      },
    },
  }
);

// Índices para mejorar performance de consultas
productHistorySchema.index({ gtin: 1, changedAt: -1 }); // Para consultar historial por producto ordenado por fecha
productHistorySchema.index({ changedBy: 1 }); // Para consultar cambios por usuario
productHistorySchema.index({ action: 1 }); // Para filtrar por tipo de acción
productHistorySchema.index({ changedAt: -1 }); // Para consultas ordenadas por fecha

const ProductHistory = mongoose.model('ProductHistory', productHistorySchema);
export default ProductHistory;
