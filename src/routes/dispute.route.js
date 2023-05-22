const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middlewares/auth.middleware');
const disputeController = require('../controllers/dispute.controller');

router.post('/byUser/:orderId', authenticate, disputeController.byUser);
router.post(
  '/byAdmin',
  authenticate,
  authorize('admin'),
  disputeController.byAdmin
);
router.get('/getDisputes', authenticate, disputeController.getDisputes);

module.exports = router;
