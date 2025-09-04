import mongoose from 'mongoose';

const productSchema = new mongoose.Schema(
  {
    gtin: {
      // Identificador único conforme a GS1
      type: String,
      required: true,
      unique: true,
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
    // Nuevos campos para FASE 2 - Estados y flujo editorial
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
      transform: function (doc, ret) {
        ret.id = ret._id.toString();
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
    toObject: {
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

const Product = mongoose.model('Product', productSchema);
export default Product;
