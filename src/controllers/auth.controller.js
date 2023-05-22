const User = require('../models/user.model');
const OtpModel = require('../models/otp.model');

// Error handling
const asyncHandler = require('../middlewares/async.middleware');
const errorResponse = require('../utils/error.utils');

// Packages
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const axios = require('axios');
require('dotenv').config();

// utils
const mailauth = require('../utils/mailAuth.utils');
const logger = require('../utils/winston');

// Mongoose
const mongoose = require('mongoose');

// Repository
const Repository = require('../repository/mongoose');

// Model enums
const { DB_MODELS } = require('../utils/modelEnums');

// Joi schemas
const {
  registerSchema,
  loginSchema,
  updateSchema,
  checkAccountSchema,
  sellerRequestSchema,
  findByLocationSchema,
} = require('../joi/auth');

const { createAddressSchema, updateAddressSchema } = require('../joi/address');
const {
  ADDRESS_TYPE,
  USER_ROLE,
  SELLER_REQUEST,
  DISTANCE_UNIT,
} = require('../utils/enums');

// @desc 	  Register User
// @route 	POST api/v1/auth/register
// @access	Public
const register = asyncHandler(async (req, res, next) => {
  const session = await mongoose.startSession();
  // session.startTransaction();
  try {
    const joiValidation = registerSchema.validate(req.body);
    if (joiValidation.error) {
      // await session.abortTransaction();
      return next(
        new errorResponse(joiValidation.error.details[0].message, 400)
      );
    }

    let { first_name, last_name, email, phone, username, password, otp } =
      req.body;
    first_name = first_name.trim();
    last_name = last_name.trim();

    const salt = await bcrypt.genSalt(10);
    let hashedPassword = await bcrypt.hash(password, salt);
    const government_id = {};
    // const theUser = await User.findOne({ phone });
    const { data: theUser, error: errFetchingUser } = await Repository.fetchOne(
      {
        modelName: DB_MODELS.user,
        query: {
          phone,
        },
        include: ['store_address', 'seller_address'],
        // t: session,
      },
      logger
    );

    if (errFetchingUser) {
      // await session.abortTransaction();
      return next(new errorResponse(errFetchingUser, 500));
    }

    if (theUser && theUser.phone_verified == true) {
      // await session.abortTransaction();
      logger.error('Error phone already exist');
      return next(new errorResponse('Error duplicate phone number', 401));
    }

    const updateObject = {
      phone_verified: true,
      first_name,
      last_name,
      email,
      username,
      password: hashedPassword,
      government_id,
    };

    if (theUser) {
      axios
        .get(
          `https://2factor.in/API/V1/` +
            process.env.TWO_FACTOR_IN_KEY +
            `/SMS/VERIFY/` +
            theUser.two_factor_session_id +
            `/` +
            otp
        )
        .then(async (response) => {
          if (response.data.Status == 'Success') {
            //   .catch(async (err) => {
            // await session.abortTransaction();
            //     return next(
            //       new errorResponse(`Error invalid OTP: ${err.toString()}`, 500)
            //     );
            //   });
            const { data: updatedUser, error: errUpdatingUser } =
              await Repository.updateOne(
                {
                  modelName: DB_MODELS.user,
                  query: {
                    phone,
                  },
                  updateObject,
                  // t: session,
                },
                logger
              );

            if (errUpdatingUser) {
              // await session.abortTransaction();
              return next(new errorResponse('Error registering user', 500));
            }
            // await session.commitTransaction();
            sendTokenResponse(theUser, 201, res);
          }
        })
        .catch(async (err) => {
          // await session.abortTransaction();
          logger.error('Error verifying phone ', err.response.data.Details);
          return next(new errorResponse(`Error registering user`, 500));
        });
    } else {
      // await session.abortTransaction();
      logger.error('Error user not found');
      return next(new errorResponse('Error please send the otp first', 402));
    }
  } catch (err) {
    // await session.abortTransaction();
    logger.error('Error registering user: ', err);
    return next(new errorResponse('Error registering user', 500));
  } finally {
    session.endSession();
  }
});

// @desc 	  Send otp to phone
// @route 	POST api/v1/auth/sendPhoneOtp
// @access	Public
const sendPhoneOtp = asyncHandler(async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { phone } = req.params;

    // const theUser = await User.findOne({ phone });
    const { data: theUser, error: errFetchingUser } = await Repository.fetchOne(
      {
        modelName: DB_MODELS.user,
        query: {
          phone,
        },
        include: ['store_address', 'seller_address'],
        t: session,
      },
      logger
    );

    if (errFetchingUser) {
      await session.abortTransaction();
      return next(new errorResponse('Error sending Otp', 500));
    }

    if (theUser && theUser.phone_verified == true) {
      await session.abortTransaction();
      logger.error('Error duplicate phone number');
      return next(new errorResponse('Error duplicate phone number', 401));
    }

    if (theUser && theUser.phone_verified == false) {
      const { data: deletedUser, error: errDeletingUser } =
        await Repository.destroy(
          {
            modelName: DB_MODELS.user,
            query: {
              id: theUser._id,
            },
            t: session,
          },
          logger
        );

      if (errDeletingUser) {
        await session.abortTransaction();
        return next(new errorResponse('Error sending otp: ', 500));
      }
    }

    await axios
      .get(
        `https://2factor.in/API/V1/` +
          process.env.TWO_FACTOR_IN_KEY +
          `/SMS/` +
          phone +
          `/AUTOGEN`
      )
      .then(async (response) => {
        console.log('response.data.Details: ', response.data.Details);
        // Create User in database
        const createObject = {
          phone,
          two_factor_session_id: response.data.Details,
        };

        const { data: createdUser, error: errCreatingUser } =
          await Repository.create(
            {
              modelName: DB_MODELS.user,
              createObject,
              t: session,
            },
            logger
          );

        if (errCreatingUser) {
          await session.abortTransaction();
          logger.error(errCreatingUser);
          return next(new errorResponse('Error sending otp: ', 500));
        }
        console.log('line 296');
        await session.commitTransaction();
        return res.status(200).json({
          success: true,
          message: 'OTP sent , please check your phone',
        });
      })
      .catch(async (err) => {
        await session.abortTransaction();
        logger.error('Error sending otp: ', err);
        return next(
          new errorResponse(`Error sending otp: ${err.toString()}`, 500)
        );
      });
  } catch (err) {
    await session.abortTransaction();
    logger.error('Error sending otp: ', err);
    return next(new errorResponse('Error sending otp', 500));
  } finally {
    session.endSession();
  }
});

// @desc 	  Email verification
// @route 	POST api/v1/auth/emailVerification
// @access	Public
const emailVerification = async (req, res, next) => {
  const { email, otp } = req.params;
  if (req.user) {
    const otpLog = await OtpModel.findOne({
      email: email,
      otp: otp,
    });
    if (otpLog && otpLog.email) {
      const user = await User.findByIdAndUpdate(
        req.user.id,
        { $set: { email: email, email_verified: true } },
        {
          new: true,
          runValidators: true,
        }
      );
      await OtpModel.deleteMany({
        email: email,
      });
      return res.status(200).json({
        success: true,
        message: 'Email verified and updated',
      });
    } else {
      return next(new errorResponse('Invalid OTP', 401));
    }
  }
  const verUser = await User.findOne({ email: email });

  if (!verUser)
    return next(new errorResponse('User not found! Email not registered', 404));

  const otpLog = await OtpModel.findOne({
    email: email,
    otp: otp,
  });

  if (otpLog && otpLog.email) {
    await User.updateOne(
      {
        email: email,
      },
      {
        $set: {
          email_verified: true,
        },
      }
    );
    const user = await User.findOne({
      email: email,
    });

    await OtpModel.deleteMany({
      email: email,
    });
    // sendTokenResponse(user, 201, res);
    return res.status(200).json({
      success: true,
      message: 'OTP verified',
    });
  } else {
    return next(new errorResponse(`Invalid OTP: ${err.toString()}`, 401));
  }
};

// @desc 	  Phone verification
// @route 	POST api/v1/auth/phoneVerification
// @access	Public
const phoneVerification = asyncHandler(async (req, res, next) => {
  const { phone, otp } = req.params;

  const theUser = await User.findOne({ phone });

  if (theUser) {
    axios
      .get(
        `https://2factor.in/API/V1/` +
          process.env.TWO_FACTOR_IN_KEY +
          `/SMS/VERIFY/` +
          theUser.two_factor_session_id +
          `/` +
          otp
      )
      .then(async (response) => {
        if (response.data.Status == 'Success')
          return res.status(200).json({
            success: true,
            message: 'OTP verified',
          });
        else
          return next(
            new errorResponse(`Error validating otp: ${err.toString()}`, 401)
          );
      })
      .catch((err) => {
        return next(
          new errorResponse(`Error validating otp: ${err.toString()}`, 500)
        );
      });
  } else {
    logger.error('Error user not found');
    return next(new errorResponse('Error validating otp', 402));
  }
});

// @desc 	  Email verification and send token
// @route 	POST api/v1/auth/forgotMailVerification
// @access	Public
const fpMailVerification = asyncHandler(async (req, res, next) => {
  const { email, otp, password } = req.body;

  const verUser = await User.findOne({ email: email });
  if (!verUser) {
    return next(new errorResponse('User not found! Email not registered', 404));
  }
  const otpLog = await OtpModel.findOne({
    email: email,
    otp: otp,
  });

  if (otpLog && otpLog.email) {
    const salt = await bcrypt.genSalt(10);
    let hashedPassword = await bcrypt.hash(password, salt);
    await User.updateOne(
      {
        email: email,
      },
      {
        $set: {
          password: hashedPassword,
        },
      }
    );
    const user = await User.findOne({
      email: email,
    });

    await OtpModel.deleteMany({
      email: email,
    });
    res.status(200).json({
      success: true,
      message: 'Password changes',
    });
  } else {
    return next(new errorResponse(`Invalid OTP`, 401));
  }
});

// @desc 	  Login User
// @route 	POST api/v1/auth/login
// @access	Public
const login = asyncHandler(async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const joiValidation = loginSchema.validate(req.body);
    if (joiValidation.error) {
      await session.abortTransaction();
      return next(
        new errorResponse(joiValidation.error.details[0].message, 400)
      );
    }

    const { email, password, username, phone } = req.body;

    // check if field is not empty
    if (!email && !username && !phone) {
      await session.abortTransaction();
      return next(
        new errorResponse(
          'Error during login: please enter email, phone or username',
          400
        )
      );
    }

    const query = email ? { email } : username ? { username } : { phone };

    const { data: theUser, error: errFetchingUser } = await Repository.fetchOne(
      {
        modelName: DB_MODELS.user,
        query,
        t: session,
        extras: {
          select: '+password',
        },
      },
      logger
    );

    if (errFetchingUser) {
      await session.abortTransaction();
      return next(new errorResponse('Error login user', 500));
    }

    if (!theUser) {
      await session.abortTransaction();
      return next(new errorResponse('Error during login: user not exist', 401));
    }

    if (!theUser.email_verified && !theUser.phone_verified) {
      await session.abortTransaction();
      return next(
        new errorResponse(
          'Error during login: please verify your account first',
          400
        )
      );
    }

    // match password
    const isMatch = await bcrypt.compare(password, theUser.password);

    if (!isMatch) {
      await session.abortTransaction();
      return next(new errorResponse('Invalid Credentials', 401));
    }

    await session.commitTransaction();
    // Create token and send response
    sendTokenResponse(theUser, 200, res);
  } catch (err) {
    await session.abortTransaction();
    logger.error('Error during user login: ', err);
    return next(new errorResponse('Error during user login', 500));
  } finally {
    session.endSession();
  }
});

// @desc 	  Get User
// @route 	GET api/v1/auth/getMe
// @access	Authenticated
const getMe = asyncHandler(async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { data: theUser, error: errFetchingUser } =
      await Repository.fetchById(
        {
          modelName: DB_MODELS.user,
          query: {
            id: req.user._id,
          },
          include: ['store_address', 'seller_address', 'wishlist'],
          t: session,
        },
        logger
      );

    if (errFetchingUser) {
      await session.abortTransaction();
      return next(new errorResponse(errFetchingUser, 500));
    }

    await session.commitTransaction();
    res.status(200).json({
      success: true,
      data: theUser,
    });
  } catch (err) {
    await session.abortTransaction();
    logger.error('Error fetching user: ', err);
    return next(new errorResponse(`Error fetching user: ${err}`, 500));
  } finally {
    session.endSession();
  }
});

// @desc 	  Update User
// @route 	POST api/v1/auth/updateMe
// @access	Authenticated
const updateMe = asyncHandler(async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const joiValidation = updateSchema.validate(req.body);
    if (joiValidation.error) {
      await session.abortTransaction();
      return next(
        new errorResponse(joiValidation.error.details[0].message, 400)
      );
    }

    // if (req.body.email) {
    //   mailauth(req.body.email);
    //   return res.status(200).json({
    //     success: true,
    //     message: 'OTP sent',
    //   });
    // }

    const { data: theUser, error: errFetchingUser } = await Repository.fetchOne(
      {
        modelName: DB_MODELS.user,
        query: {
          id: req.user.id,
        },
        t: session,
        extras: {
          select: '+password',
        },
      },
      logger
    );

    if (errFetchingUser) {
      await session.abortTransaction();
      return next(new errorResponse('Error login user', 500));
    }

    if (req.body.new_password) {
      const isMatch = await bcrypt.compare(
        req.body.current_password,
        theUser.password
      );

      if (!isMatch) {
        await session.abortTransaction();
        return next(new errorResponse('Invalid Credentials', 401));
      }
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(req.body.new_password, salt);
      theUser.password = hashedPassword;
      await theUser.save();
      return res.status(200).json({
        success: true,
        message: 'Password updated',
      });
    }

    updatedUser = await User.findByIdAndUpdate(req.user._id, req.body, {
      new: true,
      runValidators: true,
    });

    const { data: updatedUser, error: errUpdatingUser } =
      await Repository.update(
        {
          modelName: DB_MODELS.user,
          query: {
            id: req.user.id,
          },
          t: session,
          updateObject: req.body,
          extras: {
            new: true,
            runValidators: true,
          },
        },
        logger
      );

    if (errUpdatingUser) {
      await session.abortTransaction();
      return next(new errorResponse('Error login user', 500));
    }

    await session.commitTransaction();
    res.status(200).json({
      success: true,
      message: 'User updated',
    });
  } catch (err) {
    await session.abortTransaction();
    logger.error('Error updating user: ', err);
    return next(new errorResponse('Error updating user', 500));
  } finally {
    session.endSession();
  }
});

// @desc 	  Add Address
// @route 	POST api/v1/auth/addAddress
// @access	Authenticated
const addAddress = asyncHandler(async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { data: theUser, error: errFetchingUser } =
      await Repository.fetchById(
        {
          modelName: DB_MODELS.user,
          query: {
            id: req.user._id,
          },
          t: session,
        },
        logger
      );

    if (errFetchingUser) {
      await session.abortTransaction();
      return next(new errorResponse(errFetchingUser, 500));
    }

    if (!req.body._id) {
      const joiValidation = createAddressSchema.validate(req.body);
      if (joiValidation.error) {
        await session.abortTransaction();
        return next(
          new errorResponse(joiValidation.error.details[0].message, 400)
        );
      }
      // const theAddress = await Address.create(req.body);
      const { data: createdAddress, error: errCreatingAddress } =
        await Repository.create(
          {
            modelName: DB_MODELS.address,
            createObject: {
              ...req.body,
              created_by: req.user.id,
              address_type: ADDRESS_TYPE.BUYER_ADDRESS,
            },
            t: session,
          },
          logger
        );

      if (errCreatingAddress) {
        await session.abortTransaction();
        return next(new errorResponse('Error adding address', 500));
      }

      await session.commitTransaction();
      return res.status(200).json({
        success: true,
        message: 'Address added',
        data: theUser,
      });
    } else {
      const joiValidation = updateAddressSchema.validate(req.body);
      if (joiValidation.error) {
        await session.abortTransaction();
        return next(
          new errorResponse(joiValidation.error.details[0].message, 400)
        );
      }

      const { data: updatedAddress, error: errUpdatingAddress } =
        await Repository.update(
          {
            modelName: DB_MODELS.address,
            updateObject: req.body,
            query: {
              id: req.body._id,
            },
            extras: {
              new: true,
              runValidators: true,
            },
            t: session,
          },
          logger
        );

      if (!errUpdatingAddress) {
        await session.abortTransaction();
        return next(new errorResponse('Error updating address', 500));
      }

      await session.commitTransaction();
      return res.status(200).json({
        success: true,
        message: 'Address updated',
      });
    }
  } catch (err) {
    await session.abortTransaction();
    logger.error('Error adding address: ', err);
    return next(new errorResponse('Error adding address', 500));
  } finally {
    session.endSession();
  }
});

// @desc 	  Remove Address
// @route 	POST api/v1/auth/removeAddress/:addressId
// @access	Authenticated
const removeAddress = asyncHandler(async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    // const theAddress = await Address.findById(req.params.id);
    const { addressId } = req.params;
    const { data: theUser, error: errFetchingUser } =
      await Repository.fetchById(
        {
          modelName: DB_MODELS.user,
          query: {
            id: req.user._id,
          },
          t: session,
        },
        logger
      );

    if (errFetchingUser) {
      await session.abortTransaction();
      return next(new errorResponse('Error removing address', 500));
    }

    if (req.user.role === USER_ROLE.ADMIN) {
      const { data: deletedAddress, error: errDeletingAddress } =
        await Repository.destroy(
          {
            modelName: DB_MODELS.address,
            query: {
              id: req.params.addressId,
            },
            t: session,
          },
          logger
        );

      if (errDeletingAddress) {
        await session.abortTransaction();
        return next(new errorResponse('Error removing address', 500));
      }
    } else {
      // for (const address of theUser.addresses) {
      //   if (address._id.toString() == addressId) {
      //     const { data: deletedAddress, error: errDeletingAddress } =
      //       await Repository.destroy(
      //         {
      //           modelName: DB_MODELS.address,
      //           query: {
      //             id: req.params.addressId,
      //           },
      //           t: session,
      //         },
      //         logger
      //       );
      //     if (errDeletingAddress) {
      //       await session.abortTransaction();
      //       return next(new errorResponse('Error removing address', 500));
      //     }
      //   }
      // }

      const { data: deletedAddress, error: errDeletingAddress } =
        await Repository.destroy(
          {
            modelName: DB_MODELS.address,
            query: {
              id: req.params.addressId,
              created_by: req.user.id,
            },
            t: session,
          },
          logger
        );

      if (errDeletingAddress) {
        await session.abortTransaction();
        return next(new errorResponse('Error removing address', 500));
      }
    }

    // theUser.addresses = theUser.addresses.filter((elem) => {
    //   return elem._id.toString() != addressId;
    // });
    // await theUser.save();
    await session.commitTransaction();

    return res.status(200).json({
      success: true,
      message: 'Success deleting address',
    });
  } catch (err) {
    await session.abortTransaction();
    logger.error('Error deleting address: ', err);
    return next(new errorResponse('Error deleting address', 500));
  } finally {
    session.endSession();
  }
});

// @desc 	  My listings
// @route 	POST api/v1/auth/myListing
// @access	Authenticated
const myListing = asyncHandler(async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { data: theProducts, error: errFetchingProducts } =
      await Repository.fetchOne(
        {
          modelName: DB_MODELS.product,
          query: {
            seller: req.user.id,
          },
          t: session,
        },
        logger
      );

    if (errFetchingProducts) {
      await session.abortTransaction();
      logger.error('Error fetching products: ', errFetchingProducts);
      return next(new errorResponse('Error fetching products: ', 500));
    }

    await session.commitTransaction();
    return res.status(200).json({
      success: true,
      count: theProducts.length,
      data: theProducts,
    });
  } catch (err) {
    await session.abortTransaction();
    logger.error('Error fetching user: ', err);
    return next(new errorResponse(`Error fetching user: ${err}`, 500));
  } finally {
    session.endSession();
  }
});

// @desc 	  Add Photo
// @route 	POST api/v1/auth/addPhoto
// @access	Authenticated
const addPhoto = asyncHandler(async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const result = res.imgres;
    const { data: theUser, error: errFetchingUser } =
      await Repository.fetchById(
        {
          modelName: DB_MODELS.user,
          query: {
            id: req.user._id,
          },
          t: session,
        },
        logger
      );

    if (errFetchingUser) {
      await session.abortTransaction();
      return next(new errorResponse(errFetchingUser, 500));
    }

    theUser.photo = result.secure_url;
    await theUser.save();

    await session.commitTransaction();
    return res.status(200).json({
      success: true,
      message: 'Profile image updated',
      data: theUser,
    });
  } catch (err) {
    await session.abortTransaction();
    logger.error('Error fetching user: ', err);
    return next(new errorResponse(`Error fetching user: ${err}`, 500));
  } finally {
    session.endSession();
  }
});

// @desc 	  Add Document
// @route 	POST api/v1/auth/uploadDoc/:id_number/:id_type
// @access	Authenticated
const uploadDocument = asyncHandler(async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const result = res.imgres;
    const { data: theUser, error: errFetchingUser } =
      await Repository.fetchById(
        {
          modelName: DB_MODELS.user,
          query: {
            id: req.user._id,
          },
          t: session,
        },
        logger
      );

    if (errFetchingUser) {
      await session.abortTransaction();
      return next(new errorResponse(errFetchingUser, 500));
    }
    theUser.government_id.id_image = result.secure_url;
    theUser.government_id.id_number = req.params.id_number;
    theUser.government_id.id_type = req.params.id_type;
    // theUser.government_id.comments = 'verification pending';
    // theUser.seller_request = 'created';
    await theUser.save();
    await session.commitTransaction();
    return res.status(200).json({
      success: true,
      message: 'Document uploaded',
      data: theUser,
    });
  } catch (err) {
    await session.abortTransaction();
    logger.error('Error fetching user: ', err);
    return next(new errorResponse(`Error fetching user: ${err}`, 500));
  } finally {
    session.endSession();
  }
});

// @desc 	  Seller Request
// @route 	POST api/v1/auth/sellerRequest
// @access	Authenticated
const sellerRequest = asyncHandler(async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    req.body.longitude = req.body.loc ? req.body.loc.coordinates[0] : null;
    req.body.latitude = req.body.loc ? req.body.loc.coordinates[1] : null;
    const joiValidation = sellerRequestSchema.validate(req.body);
    if (joiValidation.error) {
      await session.abortTransaction();
      return next(
        new errorResponse(joiValidation.error.details[0].message, 400)
      );
    }

    if (req.user.role === USER_ROLE.SELLER) {
      await session.abortTransaction();
      logger.error('Error role is seller');
      return next(
        new errorResponse('Error processing seller request: unauthorized', 401)
      );
    }

    req.body.seller_request = SELLER_REQUEST.CREATED;

    if (req.body.store_address) {
      req.body.store_address.address_type = ADDRESS_TYPE.STORE_ADDRESS;
      req.body.store_address.primary = true;
      // const storeAddress = await Address.create(req.body.store_address);
      const { data: storeAddress, error: errCreatingAddress } =
        await Repository.create(
          {
            modelName: DB_MODELS.address,
            createObject: req.body.store_address,
            t: session,
          },
          logger
        );

      if (errCreatingAddress) {
        await session.abortTransaction();
        return next(new errorResponse('Error sending seller request', 500));
      }
      req.body.store_address = storeAddress._id;
    }

    req.body.seller_address.address_type = ADDRESS_TYPE.SELLER_ADDRESS;
    req.body.seller_address.primary = true;
    const { data: storeAddress, error: errCreatingAddress } =
      await Repository.create(
        {
          modelName: DB_MODELS.address,
          createObject: req.body.seller_address,
          t: session,
        },
        logger
      );

    if (errCreatingAddress) {
      await session.abortTransaction();
      return next(new errorResponse('Error sending seller request', 500));
    }

    req.body.seller_address = sellerAddress._id;

    const updatedUser = await User.findByIdAndUpdate(req.user.id, req.body, {
      runValidators: true,
      new: true,
    });

    const { data: udpatedUser, error: errUpdatingUser } =
      await Repository.update(
        {
          modelName: DB_MODELS.user,
          query: {
            id: req.user._id,
          },
          updateObject: req.body,
          extras: {
            runValidators: true,
            new: true,
          },
          t: session,
        },
        logger
      );

    if (errUpdatingUser) {
      await session.abortTransaction();
      return next(new errorResponse('Error sending seller request', 500));
    }

    await session.commitTransaction();
    return res.status(200).json({
      success: true,
      message: 'Seller request sent',
      data: updatedUser,
    });
  } catch (err) {
    await session.abortTransaction();
    logger.error('Error fetching user: ', err);
    return next(new errorResponse(`Error fetching user: ${err}`, 500));
  } finally {
    session.endSession();
  }
});

// @desc 	  Find activity by location
// @route 	POST auth/findSellerByLoc
// @access	Authenticated
const findSellerByLocation = async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    // Get longitude and latitude from geocoder through zipcode
    const joiValidation = findByLocationSchema.validate(req.body);
    if (joiValidation.error) {
      await session.abortTransaction();
      return next(
        new errorResponse(joiValidation.error.details[0].message, 400)
      );
    }

    const { distance, unit } = req.body;

    const lng = req.body.longitude;
    const lat = req.body.latitude;

    // Divide distance by earth radius to get the covering radius
    // Earth radius 3963 miles and 6378 km
    let radius = 0;
    if (unit === DISTANCE_UNIT.KILOMETER || DISTANCE_UNIT.KM) {
      radius = distance / 6378;
    } else if (unit === DISTANCE_UNIT.MI || unit === DISTANCE_UNIT.MILES) {
      radius = distance / 3963;
    } else {
      await session.abortTransaction();
      return next(
        new errorResponse('Error finding seller: incorrect unit', 400)
      );
    }
    // const theUsers = await User.find({
    //   loc: {
    //     $geoWithin: {
    //       $centerSphere: [[lng, lat], radius],
    //     },
    //   },
    // });

    const { data: theUsers, error: errFetchingUsers } =
      await Repository.fetchAll(
        {
          modelName: DB_MODELS.user,
          query: {
            loc: {
              $geoWithin: {
                $centerSphere: [[lng, lat], radius],
              },
            },
          },
          t: session,
        },
        logger
      );

    if (errFetchingUsers) {
      await session.abortTransaction();
      return next(new errorResponse('Error fetching users by location', 500));
    }

    await session.commitTransaction();
    return res.status(200).json({
      success: true,
      count: theUsers.length,
      data: theUsers,
    });
  } catch (err) {
    await session.abortTransaction();
    logger.error('Error fetching user: ', err);
    return next(new errorResponse(`Error fetching user: ${err}`, 500));
  } finally {
    session.endSession();
  }
};

// @desc 	  Forgot password
// @route 	POST api/v1/auth/forgotPassword
// @access	Public
const forgotPassword = asyncHandler(async (req, res, next) => {
  const { email } = req.body;

  const { data: theUser, error: errFetchingUser } = await Repository.fetchOne(
    {
      modelName: DB_MODELS.user,
      query: {
        email,
      },
    },
    logger
  );

  if (errFetchingUser) {
    await session.abortTransaction();
    return next(new errorResponse('Error login user', 500));
  }
  if (!theUser) return next(new errorResponse('Error finding user', 404));

  mailauth(email);

  res.status(200).json({
    success: true,
    message: 'Success',
  });
});

// @desc 	  Check account
// @route 	GET api/v1/auth/checkAccount
// @access	public
const checkAccount = asyncHandler(async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const joiValidation = checkAccountSchema.validate(req.body);
    if (joiValidation.error) {
      await session.abortTransaction();
      return next(
        new errorResponse(joiValidation.error.details[0].message, 400)
      );
    }
    const { email, phone, username } = req.body;

    if (!email && !username && !phone) {
      await session.abortTransaction();
      return next(
        new errorResponse(
          'Error during login: please enter email, phone or username',
          400
        )
      );
    }

    const query = email ? { email } : username ? { username } : { phone };

    const { data: theUser, error: errFetchingUser } = await Repository.fetchOne(
      {
        modelName: DB_MODELS.user,
        query,
        t: session,
      },
      logger
    );

    if (errFetchingUser) {
      await session.abortTransaction();
      return next(new errorResponse('Error login user', 500));
    }

    if (theUser && theUser.phone_verified) {
      await session.commitTransaction();
      return res.status(200).json({
        success: true,
        data: theUser.first_name,
      });
    } else {
      await session.abortTransaction();
      return next(new errorResponse(`Error fetching user`, 404));
    }
  } catch (err) {
    await session.abortTransaction();
    logger.error('Error fetching user: ', err);
    return next(new errorResponse(`Error fetching user: ${err}`, 500));
  } finally {
    session.endSession();
  }
});

// @desc 	  Get all sellers
// @route 	GET api/v1/auth/seller/all
// @access	Public
const getSeller = asyncHandler(async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    let { select, sort, page, limit } = req.query;
    const attributes = [
      'first_name',
      'last_name',
      'username',
      'created_at',
      'photo',
      'avg_rating',
      'seller_address',
      'loc',
      'gender',
      'seller_verified',
      'email_verified',
      'phone_verified',
      'store_address',
      'seller_type',
    ];

    const { data: sellers, error: errFetchingSellers } =
      await Repository.fetchAll(
        {
          modelName: DB_MODELS.user,
          query: {
            role: USER_ROLE.SELLER,
          },
          extras: {
            attributes,
            select,
            sort,
            page,
            limit,
          },
          t: session,
        },
        logger
      );

    if (errFetchingSellers) {
      await session.abortTransaction();
      logger.error('Error fetching sellers: ', errFetchingSellers);
      return next(new errorResponse('Error fetching sellers ', 500));
    }

    await session.commitTransaction();
    res.status(200).json({
      success: true,
      data: sellers,
    });
  } catch (err) {
    await session.abortTransaction();
    logger.error('Error fetching user: ', err);
    return next(new errorResponse(`Error fetching user: ${err}`, 500));
  } finally {
    session.endSession();
  }
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

module.exports = {
  register,
  sendPhoneOtp,
  emailVerification,
  phoneVerification,
  fpMailVerification,
  login,
  getMe,
  updateMe,
  addAddress,
  removeAddress,
  myListing,
  addPhoto,
  uploadDocument,
  sellerRequest,
  findSellerByLocation,
  forgotPassword,
  checkAccount,
  getSeller,
};
