const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middlewares/auth.middleware');
const qNacontroller = require('../controllers/qNa.controller');

router.post('/ask', authenticate, qNacontroller.askQue);
router.post('/ans', authenticate, qNacontroller.ansQue);
router.get('/get/:productId', qNacontroller.getQnA);
router.patch('/ans/upvote/:qnaId', authenticate, qNacontroller.upvote);
router.patch('/ans/devote/:qnaId', authenticate, qNacontroller.devote);
router.delete(
  '/delete/:qnaId',
  authenticate,
  authorize('seller', 'admin'),
  qNacontroller.deleteQue
);

module.exports = router;
