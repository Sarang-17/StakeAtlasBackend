const express = require('express');
const router = express.Router();
const { authenticate } = require('../middlewares/auth.middleware');
const cartController = require('../controllers/cart.controller');

router.get('/getItems', authenticate, cartController.getItems);
router.post(
  '/product/remove/:productId',
  authenticate,
  cartController.removeItem
);
router.post('/coupon/apply', authenticate, cartController.applyCoupon);
router.post('/coupon/remove', authenticate, cartController.removeCoupon);
router.get('/my', authenticate, cartController.myCart);

module.exports = router;
