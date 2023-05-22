const asyncHandler = require('../middlewares/async.middleware');
const errorResponse = require('../utils/error.utils');

// Add joi
const { createCouponSchema, updateCouponSchema } = require('../joi/coupon');
const { DB_MODELS } = require('../utils/modelEnums');
const mongoose = require('mongoose');
const Repository = require('../repository/mongoose');
const logger = require('../utils/winston');

const addCoupon = asyncHandler(async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    if (!req.body._id) {
      const joiValidation = createCouponSchema.validate(req.body);
      if (joiValidation.error) {
        await session.abortTransaction();
        return next(
          new errorResponse(joiValidation.error.details[0].message, 400)
        );
      }

      const { data: createdCoupon, error: errCreatingCoupon } =
        await Repository.create(
          {
            modelName: DB_MODELS.coupon,
            createObject: req.body,
            t: session,
          },
          logger
        );

      if (errCreatingCoupon) {
        await session.abortTransaction();
        logger.error('Error creating coupon: ', errCreatingCoupon);
        return next(new errorResponse('Error creating coupon: ', 500));
      }

      await session.commitTransaction();
      res.status(200).json({
        success: true,
        message: 'Coupon added',
        data: createdCoupon,
      });
    } else {
      const joiValidation = updateCouponSchema.validate(req.body);
      if (joiValidation.error) {
        await session.abortTransaction();
        return next(
          new errorResponse(joiValidation.error.details[0].message, 400)
        );
      }

      // const coupon = await Coupon.findByIdAndUpdate(req.body._id, req.body);
      const { data: updatedCoupon, error: errUpdatingCoupon } =
        await Repository.updateOne(
          {
            modelName: DB_MODELS.coupon,
            query: {
              _id: req.body._id,
            },
            updateObject: req.body,
            t: session,
          },
          logger
        );

      if (errUpdatingCoupon) {
        await session.abortTransaction();
        logger.error('Error updating coupon: ', errUpdatingCoupon);
        return next(new errorResponse('Error updating coupon: ', 500));
      }

      await session.commitTransaction();
      res.status(200).json({
        success: true,
        message: 'Coupon updated',
      });
    }
  } catch (err) {
    await session.abortTransaction();
    logger.error('Error adding coupons: ', err);
    return next(new errorResponse('Error adding coupons', 500));
  } finally {
    session.endSession();
  }
});

const getCoupons = asyncHandler(async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    let { select, sort, page, limit } = req.query;

    let queryString = JSON.stringify(req.query);

    // add $ sign to symbols
    queryString = queryString.replace(
      /\b(gt|gte|lt|lte|in)\b/g,
      (match) => `$${match}`
    );

    const { data: fetchedCoupons, error: errFetchingCoupons } =
      await Repository.fetchAll(
        {
          modelName: DB_MODELS.coupon,
          query: queryString,
          extras: {
            select,
            sort,
            page,
            limit,
          },
          t: session,
        },
        logger
      );

    if (errFetchingCoupons) {
      await session.abortTransaction();
      logger.error('Error fetching coupons: ', errFetchingCoupons);
      return next(new errorResponse('Error fetching coupons ', 500));
    }

    await session.commitTransaction();
    res.status(200).json({
      success: true,
      count: fetchedCoupons.count,
      data: fetchedCoupons,
    });
  } catch (err) {
    await session.abortTransaction();
    logger.error('Error fetching coupons: ', err);
    return next(new errorResponse(`Error fetching coupons: ${err}`, 500));
  } finally {
    session.endSession();
  }
});

module.exports = {
  addCoupon,
  getCoupons,
};
