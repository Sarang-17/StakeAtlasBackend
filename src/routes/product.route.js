const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middlewares/auth.middleware');
const productController = require('../controllers/product.controller');
const { uploadProductImages } = require('../middlewares/addImage.middleware');

router.get('/all', productController.getProducts);
router.get('/getSingleProduct/:productId', productController.getProduct);
router.post(
  '/wishlist/add/:productId',
  authenticate,
  productController.addToWishlist
);
router.post('/cart/add/:productId', authenticate, productController.addToCart);
router.post(
  '/add',
  authenticate,
  authorize('seller', 'admin'),
  productController.addProduct
);
router.post(
  '/delete/:productId',
  authenticate,
  authorize('seller', 'admin'),
  productController.deleteProduct
);
router.post(
  '/image/:productId',
  authenticate,
  authorize('seller', 'admin'),
  uploadProductImages('products/'),
  productController.uploadImages
);
router.post('/ByLocation', authenticate, productController.findByLocation);

module.exports = router;
