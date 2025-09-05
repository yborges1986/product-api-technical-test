import mongoose from 'mongoose';
import { recordAuditEntry } from '../utils/audit.util.js';
import {
  isValidGTIN,
  getGTINValidationError,
  formatGTIN,
} from '../utils/gtin.util.js';

const productSchema = new mongoose.Schema(
  {
    gtin: {
      // Identificador único conforme a GS1
      type: String,
      required: true,
      unique: true,
      validate: {
        validator: function (value) {
          return isValidGTIN(value);
        },
        message: function (props) {
          return getGTINValidationError(props.value);
        },
      },
      set: function (value) {
        // Normalizar el GTIN al guardarlo (eliminar espacios, guiones, etc.)
        return formatGTIN(value);
      },
    },
    name: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    brand: {
      type: String,
      required: true,
    },
    manufacturer: {
      type: String,
      required: true,
    },
    // MEJORA: Peso neto con valor numérico y unidad de medida
    netWeight: {
      type: Number,
      required: true,
      min: [0.01, 'El peso neto debe ser mayor a 0'],
    },
    netWeightUnit: {
      type: String,
      enum: {
        values: ['g', 'kg', 'ml', 'l', 'oz', 'lb'],
        message:
          'Unidad de peso neta inválida. Valores permitidos: g, kg, ml, l, oz, lb',
      },
      required: true,
    },

    status: {
      type: String,
      enum: ['pending', 'published'],
      default: 'pending',
      required: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    approvedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true, // Agrega createdAt y updatedAt automáticamente
    toJSON: {
      virtuals: true, // Incluir virtuals en JSON
      transform: function (doc, ret) {
        ret.id = ret._id.toString();
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
    toObject: {
      virtuals: true, // Incluir virtuals en Object
      transform: function (doc, ret) {
        ret.id = ret._id.toString();
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  }
);

// Índices para mejorar performance de consultas
productSchema.index({ status: 1 });
productSchema.index({ createdBy: 1 });
productSchema.index({ status: 1, createdBy: 1 });

// ==================== VIRTUAL POPULATE ====================

// Virtual populate para el historial del producto
productSchema.virtual('history', {
  ref: 'ProductHistory',
  localField: '_id', // Campo en Product (ObjectId)
  foreignField: 'productId', // Campo en ProductHistory
  options: {
    sort: { changedAt: -1 }, // Más reciente primero
    limit: 10, // Solo los últimos 10 registros
    populate: { path: 'changedBy' }, // Poblar también el usuario que hizo el cambio
  },
});

// ==================== HOOKS DE AUDITORÍA ====================

// Variable para almacenar datos anteriores antes del save
productSchema.pre('save', async function (next) {
  try {
    // Solo para documentos existentes (updates)
    if (!this.isNew) {
      // Obtener datos originales del documento antes de la modificación
      const originalDoc = await this.constructor.findById(this._id).lean();
      this._originalData = originalDoc;
    }
    next();
  } catch (error) {
    next(error);
  }
});

// Hook post-save para registrar cambios
productSchema.post('save', async function (doc) {
  try {
    const userId = this._auditUser; // Usuario será establecido desde el servicio

    if (!userId) {
      console.warn('No audit user found for product change:', doc.gtin);
      return;
    }

    // Verificar si es creación (no tiene _originalData) o actualización
    if (!this._originalData) {
      // Producto nuevo - registrar creación
      await recordAuditEntry({
        gtin: doc.gtin,
        productId: doc._id,
        action: 'created',
        changedBy: userId,
        previousData: null,
        newData: doc.toObject(),
        changes: null,
      });
    } else {
      // Producto existente - registrar actualización
      await recordAuditEntry({
        gtin: doc.gtin,
        productId: doc._id,
        action: 'updated',
        changedBy: userId,
        previousData: this._originalData,
        newData: doc.toObject(),
      });
    }
  } catch (error) {
    console.error('Error in post-save audit hook:', error);
    // No lanzamos error para no afectar el flujo principal
  }
});

// Hook para registrar eliminaciones
productSchema.pre(
  'deleteOne',
  { document: true, query: false },
  async function (next) {
    try {
      const userId = this._auditUser;

      if (userId) {
        await recordAuditEntry({
          gtin: this.gtin,
          productId: this._id,
          action: 'deleted',
          changedBy: userId,
          previousData: this.toObject(),
          newData: null,
        });
      }

      next();
    } catch (error) {
      console.error('Error in pre-deleteOne audit hook:', error);
      next(error);
    }
  }
);

// Hook específico para aprobaciones (se llamará manualmente desde el servicio)
productSchema.methods.recordApproval = async function (approvedBy) {
  try {
    const previousData =
      this._originalData || (await this.constructor.findById(this._id).lean());

    await recordAuditEntry({
      gtin: this.gtin,
      productId: this._id,
      action: 'approved',
      changedBy: approvedBy,
      previousData,
      newData: this.toObject(),
    });
  } catch (error) {
    console.error('Error recording approval audit:', error);
    throw error;
  }
};

// Método para establecer el usuario de auditoría
productSchema.methods.setAuditUser = function (userId) {
  this._auditUser = userId;
  return this;
};

const Product = mongoose.model('Product', productSchema);
export default Product;
