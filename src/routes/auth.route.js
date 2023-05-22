const express = require('express');
const router = express.Router();
const { authenticate } = require('../middlewares/auth.middleware');
const authController = require('../controllers/auth.controller');
const { uploadToUser } = require('../middlewares/addImage.middleware');

// Routes
const brandRoutes = require('./brand.route');
const categoryRoutes = require('./category.route');
const modelRoutes = require('./model.route');

router.post('/register', authController.register);
router.post('/login', authController.login);
router.get('/getMe', authenticate, authController.getMe);
router.post('/updateMe', authenticate, authController.updateMe);
router.post('/addAddress', authenticate, authController.addAddress);
router.post(
  '/removeAddress/:addressId',
  authenticate,
  authController.removeAddress
);
router.get('/myListing', authenticate, authController.myListing);
router.post('/checkAccount', authController.checkAccount);
router.post(
  '/photo/add',
  authenticate,
  uploadToUser('profilePhoto/'),
  authController.addPhoto
);
router.post(
  '/document/upload/:id_number/:id_type',
  authenticate,
  uploadToUser('documents/'),
  authController.uploadDocument
);
router.post(
  '/emailReverification/:email/:otp',
  authenticate,
  authController.emailVerification
);
router.post('/phoneVerification/:phone/:otp', authController.phoneVerification);
router.post('/sendPhoneOtp/:phone', authController.sendPhoneOtp);
router.post('/emailVerification/:email/:otp', authController.emailVerification);
// router.post(
// 	'/passwordMailVerification/:email/:otp',
// 	authController.fpMailVerify,
// );
router.post('/forgotPassword', authController.forgotPassword);
router.post('/sellerRequest', authenticate, authController.sellerRequest);
router.post('/sellerByLoc', authenticate, authController.findSellerByLocation);
router.get('/seller/all', authController.getSeller);

// Route redirection
router.use('/brand', brandRoutes);
router.use('/category', categoryRoutes);
router.use('/model', modelRoutes);

module.exports = router;
