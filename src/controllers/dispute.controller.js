const Dispute = require('../models/dispute.model');
const asyncHandler = require('../middlewares/async.middleware');
const errorResponse = require('../utils/error.utils');
const Order = require('../models/order.model');

// Packages
const mongoose = require('mongoose');

// Repos
const Repository = require('../repository/mongoose');

// Enums
const { DB_MODELS } = require('../utils/modelEnums');

// Logger
const logger = require('../utils/winston');

const byUser = asyncHandler(async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { orderId } = req.params;

    const { data: existingDispute, error: errExistingDispute } =
      await Repository.fetchOne(
        {
          modelName: DB_MODELS.dispute,
          query: {
            order: orderId,
          },
          t: session,
        },
        logger
      );

    if (errExistingDispute) {
      await session.abortTransaction();
      logger.error('Error fetching existing dispute: ', errExistingDispute);
      return next(new errorResponse('Error sending message ', 500));
    }

    if (!existingDispute) {
      const { data: createdDispute, error: errCreatingDispute } =
        await Repository.create(
          {
            modelName: DB_MODELS.dispute,
            createObject: {
              order: orderId,
              user: req.user.id,
              chats: [req.body.message],
            },
            t: session,
          },
          logger
        );

      if (errCreatingDispute) {
        await session.abortTransaction();
        logger.error('Error fetching existing dispute: ', errCreatingDispute);
        return next(new errorResponse('Error sending message ', 500));
      }

      await session.commitTransaction();
      return res.status(200).json({
        success: true,
        message: 'Success raising dispute',
        data: createdDispute,
      });
    }
    existingDispute.chats.push(req.body.message);
    await existingDispute.save();

    await session.commitTransaction();
    return res.status(200).json({
      success: true,
      message: 'Message sent',
      data: existingDispute,
    });
  } catch (err) {
    await session.abortTransaction();
    logger.error('Error sending message: ', err);
    return next(new errorResponse(`Error sending message: ${err}`, 500));
  } finally {
    session.endSession();
  }
});

const byAdmin = asyncHandler(async (req, res, next) => {
  let dispute = await Dispute.findById(req.body._id);
  const order = await Order.findById(dispute.order);
  if (!dispute) {
    return next(new errorResponse('Dispute not found', 404));
  }
  if (req.body.resolved) {
    dispute.resolved = true;
    await dispute.save();
    res.status(200).json({
      success: true,
      message: 'Dispute markes as solved',
      data: dispute,
    });
  }
  dispute.chats.push(req.body.message);
  await dispute.save();
  res.status(200).json({
    success: true,
    message: 'Message sent',
    data: dispute,
  });
});

const getDisputes = asyncHandler(async (req, res, next) => {
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

    const { data: fetchedDisputes, error: errFetchingDisputes } =
      await Repository.fetchAll(
        {
          modelName: DB_MODELS.dispute,
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

    if (errFetchingDisputes) {
      await session.abortTransaction();
      logger.error('Error fetching dispute: ', errFetchingDisputes);
      return next(new errorResponse('Error fetching dispute ', 500));
    }

    await session.commitTransaction();
    res.status(200).json({
      success: true,
      count: fetchedDisputes.count,
      data: fetchedDisputes,
    });
  } catch (err) {
    await session.abortTransaction();
    logger.error('Error fetching disputes: ', err);
    return next(new errorResponse(`Error fetching disputes: ${err}`, 500));
  } finally {
    session.endSession();
  }
});

module.exports = {
  byUser,
  byAdmin,
  getDisputes,
};
