const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middlewares/auth.middleware');
const makeOfferController = require('../controllers/makeOffer.controller');

router.post('/', authenticate, makeOfferController.byUser);
// router.post(
// 	'/bySeller',
// 	authenticate,
// 	authorize('seller'),
// 	makeOfferController.bySeller,
// );
router.get('/', authenticate, makeOfferController.getOffers);
router.patch(
  '/closeOffers/:productId',
  authenticate,
  authorize('admin'),
  makeOfferController.closeOffers
);

module.exports = router;
