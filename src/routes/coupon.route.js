const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middlewares/auth.middleware');
const couponController = require('../controllers/coupon.controller');

router.post(
  '/add',
  authenticate,
  authorize('admin'),
  couponController.addCoupon
);
router.get(
  '/all',
  authenticate,
  authorize('admin'),
  couponController.getCoupons
);

module.exports = router;
