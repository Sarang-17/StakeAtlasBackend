const User = require('../models/user.model');
const asyncHandler = require('../middlewares/async.middleware');
const errorResponse = require('../utils/error.utils');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Product = require('../models/product.model');
const sendEmail = require('../utils/sendEmail.utils');
const mailauth = require('../utils/mailAuth.utils');
const logger = require('../utils/winston');
require('dotenv').config();

// @desc 	Create or Update User
// @route 	POST api/v1/admin/createUser
// @access	Private to Admin
exports.createUser = asyncHandler(async (req, res, next) => {
  if (!req.body._id) {
    const { name, email, phone, password, role } = req.body;
    name = name.trim();
    const theUser = await User.findOne({ email: email });
    if (theUser && theUser.email_verified == false) {
      await User.deleteOne({ email: email }, (err) => {
        if (err) {
          return next(new errorResponse(err.message, 500));
        }
      })
        .clone()
        .catch(function (err) {
          logger.error('Error creating user: ', err);
        });
    }
    const mailres = await mailauth(email);
    if (mailres) return next(new errorResponse(mailres, 500));

    const salt = await bcrypt.genSalt(10);
    let hashedPassword = await bcrypt.hash(password, salt);
    // Create User in database
    const user = await User.create({
      name,
      email,
      phone,
      password: hashedPassword,
      role,
    });

    return res.status(200).json({
      success: true,
      message: 'OTP sent , please check your mail and verify',
    });
    // Create token and send response
    // sendTokenResponse(user, 201, res);
  } else {
    const user = await User.findByIdAndUpdate(req.body._id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!user) {
      return next(new errorResponse('User not found', 404));
    }

    res.status(200).json({
      success: true,
      message: 'user updated',
    });
  }
});

// @desc 	Get all User
// @route 	GET api/v1/admin/getAllUsers
// @access	Private to Admin
exports.getAllUsers = asyncHandler(async (req, res, next) => {
  const users = await User.find();

  res.status(200).json({
    success: true,
    count: res.advanceResult.count,
    pagination: res.advanceResult.pagination,
    data: res.advanceResult.data,
  });
});

// @desc 	Delete User
// @route 	POST api/v1/admin/deleteUser/:userId
// @access	Private to Admin
exports.deleteUser = asyncHandler(async (req, res, next) => {
  await User.findByIdAndDelete(req.params.userId, (err) => {
    if (err) {
      return res.status(500).json({
        success: false,
        error: err.message,
      });
    } else {
      return res.status(200).json({
        success: true,
        message: 'Deleted successfully',
      });
    }
  })
    .clone()
    .catch(function (err) {
      logger.error('Error deleting user: ', err);
    });
});

// @desc 	Verify Product
// @route 	POST api/v1/admin/verifyProduct/:productId
// @access	Private to Admin
exports.verifyProduct = asyncHandler(async (req, res, next) => {
  const product = await Product.findByIdAndUpdate(req.body._id, req.body);

  if (!product) {
    return next(new errorResponse('Product not found', 404));
  }
  res.status(200).json({
    success: true,
    message: `Status changed from 'Waiting for approval' to '${req.body.add_request}'`,
  });
});

// @desc 	Verify Seller
// @route 	POST api/v1/admin/verifySeller/
// @access	Private to Admin
exports.verifySeller = asyncHandler(async (req, res, next) => {
  const user = await User.findByIdAndUpdate(req.body._id, req.body);

  if (!user) {
    return next(new errorResponse('User not found', 404));
  }

  if (req.body.seller_request == 'Accepted') {
    req.body.role = 'seller';
    const options = {
      heading: 'You are now a verified seller',
      mainmessage:
        'Congratulations, Your documents are verified and you are now a verified seller',
      email: user.email,
      subject: 'Seller verification',
    };
    sendEmail(options);
  } else if (req.body.seller_request == 'Rejected') {
    const options = {
      heading: 'Seller request declined',
      mainmessage:
        'Sorry , Your documents are not verified, Try reuploading the documents',
      email: user.email,
      subject: 'Seller verification',
    };
    sendEmail(options);
  }

  res.status(200).json({
    success: true,
    message: `Seller Request changed from created to ${req.body.seller_request}`,
  });
});

// @desc 	Single figures
// @route 	POST api/v1/admin/singleFig/
// @access	Private to Admin
exports.singleFig = asyncHandler(async (req, res, next) => {
  const sellers = await User.find({ role: 'seller' });
  const customers = await User.find({ role: 'customer' });

  res.status(200).json({
    success: true,
    sellers: sellers.length,
    customers: customers.length,
  });
});

// create and send cookie and token
const sendTokenResponse = (user, statusCode, res) => {
  const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE,
  });

  const options = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRE * 24 * 60 * 60 * 1000
    ),
    httpOnly: true,
  };

  res.status(statusCode).json({
    success: true,
    token: token,
    message: `${user.email} sucesss full `,
  });
};
