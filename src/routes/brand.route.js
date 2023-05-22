const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middlewares/auth.middleware');
const brandController = require('../controllers/brand.controller');
const { uploadToCloudinary } = require('../middlewares/addImage.middleware');

router.get('/all', brandController.getBrands);
router.post(
  '/create',
  authenticate,
  authorize('admin'),
  brandController.createBrand
);
router.patch(
  '/update',
  authenticate,
  authorize('admin'),
  brandController.createBrand
);
router.post(
  '/image/add/:brandId',
  authenticate,
  authorize('admin'),
  uploadToCloudinary('brands/'),
  brandController.addImage
);

module.exports = router;
