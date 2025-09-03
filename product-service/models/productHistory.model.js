import mongoose from 'mongoose';

const productHistorySchema = new mongoose.Schema({
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true,
  },
  changeType: {
    type: String,
    enum: ['create', 'update', 'delete'],
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
});

const ProductHistory = mongoose.model('ProductHistory', productHistorySchema);
export default ProductHistory;
