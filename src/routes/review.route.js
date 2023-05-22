const express = require('express');
const router = express.Router();
const { authenticate } = require('../middlewares/auth.middleware');
const reviewController = require('../controllers/review.controller');

router.post('/:userId', authenticate, reviewController.addReview);
router.delete('/:reviewId', authenticate, reviewController.delReview);
router.get('/', reviewController.getReviews);

module.exports = router;
