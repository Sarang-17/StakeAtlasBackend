const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middlewares/auth.middleware');
const adminController = require('../controllers/admin.controller');
const productController = require('../controllers/product.controller');
// const orderController = require('../controllers/rzpay_order.controller');
const User = require('../models/user.model');
const Order = require('../models/order.model');
const filterResults = require('../middlewares/filter.middleware');

// Routes
const categoryRoutes = require('./category.route');
const brandRoutes = require('./brand.route');
const modelRoutes = require('./model.route');

// Private to admin
// #userRegion
router.get(
  '/user/all',
  authenticate,
  authorize('admin'),
  filterResults(User),
  adminController.getAllUsers
);
router.post(
  '/user/create',
  authenticate,
  authorize('admin'),
  adminController.createUser
);
router.post(
  '/user/delete/:userId',
  authenticate,
  authorize('admin'),
  adminController.deleteUser
);
router.post(
  '/seller/verify',
  authenticate,
  authorize('admin'),
  adminController.verifySeller
);
// #endregion

// #Productregion
router.post(
  '/product/verify',
  authenticate,
  authorize('admin'),
  adminController.verifyProduct
);
router.post(
  '/product/add',
  authenticate,
  authorize('admin'),
  productController.addProduct
);
router.post(
  'product/delete/:productId',
  authenticate,
  authorize('admin'),
  productController.deleteProduct
);
// #endregion

// #Orderregion
router.get(
  '/order/all',
  authenticate,
  authorize('admin'),
  filterResults(Order)
  // orderController.allOrders
);
// #endregion

router.get(
  '/singleFig',
  authenticate,
  authorize('admin'),
  adminController.singleFig
);

// Redirection
router.use('/category', categoryRoutes);
router.use('/brand', brandRoutes);
router.use('/model', modelRoutes);

module.exports = router;
