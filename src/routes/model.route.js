const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middlewares/auth.middleware');
const modelController = require('../controllers/model.controller');
const filterResults = require('../middlewares/filter.middleware')
const Model = require('../models/model.model');

router.get(
  '/all',
  filterResults(Model, 'specification'),
  modelController.getModels
);
router.post(
  '/create',
  authenticate,
  authorize('admin'),
  modelController.createModel
);
router.patch(
  '/update',
  authenticate,
  authorize('admin'),
  modelController.createModel
);
router.post(
  '/add/specification',
  authenticate,
  authorize('admin'),
  modelController.addSpecification
);
router.get('/specification/all', modelController.getSpecification);

module.exports = router;
