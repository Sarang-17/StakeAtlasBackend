const express = require('express');
const router = express.Router();
const { authenticate } = require('../middlewares/auth.middleware');
const orderController = require('../controllers/rzpay_order.controller');

// # From Add to Cart
router.post('/create', authenticate, orderController.createRzpayOrderId);

// # From Direct Buy now
router.post(
  '/createOrder/:productId/:addressId',
  authenticate,
  orderController.createRzpayOrderId
);

router.post('/verify', authenticate, orderController.verifySignature);
router.get('/myOrder', authenticate, orderController.myOrder);

module.exports = router;
