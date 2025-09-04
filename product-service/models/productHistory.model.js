import mongoose from 'mongoose';

const productHistorySchema = new mongoose.Schema(
  {
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
    },
    changeType: {
      type: String,
      enum: ['create', 'update', 'delete', 'approve'],
      required: true,
    },
    changedAt: {
      type: Date,
      default: Date.now,
    },
    oldData: {
      type: Object,
      default: null,
    },
    newData: {
      type: Object,
      default: null,
    },
    // Puedes agregar un campo para usuario si lo necesitas
    // user: { type: String }
  },
  {
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

const ProductHistory = mongoose.model('ProductHistory', productHistorySchema);
export default ProductHistory;
