const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middlewares/auth.middleware');
const categoryController = require('../controllers/category.controller');
const { uploadToCloudinary } = require('../middlewares/addImage.middleware');

router.get('/all', categoryController.getAllCategories);
router.post(
  '/create',
  authenticate,
  authorize('admin'),
  categoryController.createCategory
);
router.post(
  '/image/add/:categoryId',
  authenticate,
  authorize('admin'),
  uploadToCloudinary('categories/'),
  categoryController.addImage
);
router.post(
  '/add/subcategory/:categoryId',
  authenticate,
  authorize('admin'),
  categoryController.addSubCategory
);

module.exports = router;
