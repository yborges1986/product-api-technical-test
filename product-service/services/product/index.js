import createProduct from './createProduct.js';
import {
  getProduct,
  getProducts,
  getProductsByStatus,
  getPendingProducts,
} from './getProduct.js';
import updateProduct from './updateProduct.js';
import deleteProduct from './deleteProduct.js';
import approveProduct from './approveProduct.js';
import getProductHistoryService from './getProductHistory.js';
import getAuditHistory from './getAuditHistory.js';

export {
  createProduct,
  getProduct,
  getProducts,
  getProductsByStatus,
  getPendingProducts,
  updateProduct,
  deleteProduct,
  approveProduct,
  getProductHistoryService,
  getAuditHistory,
};
