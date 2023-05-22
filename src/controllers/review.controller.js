const errorResponse = require('../utils/error.utils');
const asyncHandler = require('../middlewares/async.middleware');

// Packages
const mongoose = require('mongoose');

// Repository
const Repository = require('../repository/mongoose');

// Model enums
const { DB_MODELS } = require('../utils/modelEnums');
const { USER_ROLE } = require('../utils/enums');

// Logger
const logger = require('../utils/winston');

const addReview = asyncHandler(async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { userId } = req.params;
    const { data: fetchedSeller, error: errFetchingSeller } =
      await Repository.fetchById(
        {
          modelName: DB_MODELS.user,
          query: {
            id: userId,
          },
          t: session,
        },
        logger
      );

    if (errFetchingSeller) {
      await session.abortTransaction();
      logger.error('Error fetching sellers: ', errFetchingSeller);
      return next(new errorResponse('Error adding review ', 500));
    }

    if (!fetchedSeller) {
      await session.abortTransaction();
      return next(new errorResponse('No user found', 404));
    }

    if (!req.body._id) {
      req.body.to = userId;
      req.body.from = req.user.id;

      const { data: existingReview, error: errFetchingReview } =
        await Repository.fetchOne(
          {
            modelName: DB_MODELS.review,
            query: {
              to: userId,
              from: req.user.id,
            },
            t: session,
          },
          logger
        );

      if (errFetchingReview) {
        await session.abortTransaction();
        logger.error('Error fetching review: ', errFetchingReview);
        return next(new errorResponse('Error adding review ', 500));
      }

      if (existingReview) {
        await session.abortTransaction();
        return next(new errorResponse('Review already Present', 409));
      }

      const { data: createdReview, error: errCreatingReview } =
        await Repository.create(
          {
            modelName: DB_MODELS.review,
            createObject: req.body,
            t: session,
          },
          logger
        );

      if (errCreatingReview) {
        await session.abortTransaction();
        logger.error('Error creating review: ', errCreatingReview);
        return next(new errorResponse('Error adding review ', 500));
      }

      const { data: userReviews, error: errFetchingUserReviews } =
        await Repository.fetchAll(
          {
            modelName: DB_MODELS.review,
            query: {
              to: userId,
            },
            t: session,
          },
          logger
        );

      if (errFetchingUserReviews) {
        await session.abortTransaction();
        logger.error('Error fetching review: ', errFetchingUserReviews);
        return next(new errorResponse('Error adding review ', 500));
      }

      fetchedSeller.avg_rating =
        (fetchedSeller.avg_rating + createdReview.overall_rating) /
        userReviews.length;
      await fetchedSeller.save();

      await session.commitTransaction();
      return res.status(200).json({
        success: true,
        data: createdReview,
      });
    } else {
      if (req.body.overall_rating) {
        await session.abortTransaction();
        return next(new errorResponse(`Can't update overall_rating`, 400));
      }

      const { data: updatedReview, error: errUpdatingReview } =
        await Repository.updateOne(
          {
            modelName: DB_MODELS.review,
            query: {
              _id: req.body._id,
            },
            updateObject: req.body,
            t: session,
          },
          logger
        );

      if (errUpdatingReview) {
        await session.abortTransaction();
        logger.error('Error updating review: ', errUpdatingReview);
        return next(new errorResponse('Error updating review ', 500));
      }

      await session.commitTransaction();
      return res.status(200).json({
        success: true,
        message: 'Updated successfully',
      });
    }
  } catch (err) {
    await session.abortTransaction();
    logger.error('Error creating reviews: ', err);
    return next(new errorResponse(`Error creating reviews: ${err}`, 500));
  } finally {
    session.endSession();
  }
});

const getReviews = asyncHandler(async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { select, sort, page, limit } = req.query;
    let queryString = JSON.stringify(req.query);

    // add $ sign to symbols
    queryString = queryString.replace(
      /\b(gt|gte|lt|lte|in)\b/g,
      (match) => `$${match}`
    );

    const { data: fetchedReviews, error: errFetchingReviews } =
      await Repository.fetchAll(
        {
          modelName: DB_MODELS.product,
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

    if (errFetchingReviews) {
      await session.abortTransaction();
      logger.error('Error fetching reviews: ', errFetchingReviews);
      return next(new errorResponse('Error fetching reviews ', 500));
    }

    await session.commitTransaction();
    res.status(200).json({
      success: true,
      count: fetchedReviews.count,
      data: fetchedReviews,
    });
  } catch (err) {
    await session.abortTransaction();
    logger.error('Error fetching reviews: ', err);
    return next(new errorResponse(`Error fetching reviews: ${err}`, 500));
  } finally {
    session.endSession();
  }
});

const delReview = asyncHandler(async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const reviewId = req.params.reviewId;

    const { data: existingReview, error: errFetchingReview } =
      await Repository.fetchById(
        {
          modelName: DB_MODELS.review,
          query: {
            id: reviewId,
          },
          t: session,
        },
        logger
      );

    if (errFetchingReview) {
      await session.abortTransaction();
      return next(new errorResponse('Error deleting review', 500));
    }

    if (!existingReview) {
      await session.abortTransaction();
      return next(new errorResponse('Review not found', 404));
    }

    if (
      existingReview.from.toString() != req.user.id &&
      req.user.role != USER_ROLE.ADMIN
    ) {
      await session.abortTransaction();
      return next(
        new errorResponse('Seller not allowed to delete this review', 403)
      );
    }

    // const user = await User.findById(existingReview.to);
    const { data: deletedReview, error: errDeletingReview } =
      await Repository.destroy(
        {
          modelName: DB_MODELS.review,
          query: {
            id: reviewId,
          },
          t: session,
        },
        logger
      );

    if (errDeletingReview) {
      await session.abortTransaction();
      logger.error('Error deleting review: ', errDeletingReview);
      return next(new errorResponse('Error deleting review ', 500));
    }

    await session.commitTransaction();
    return res.status(200).json({
      success: true,
      message: `Review deleted by the user `,
    });
  } catch (err) {
    await session.abortTransaction();
    logger.error('Error deleting reviews: ', err);
    return next(new errorResponse(`Error deleting reviews: ${err}`, 500));
  } finally {
    session.endSession();
  }
});

module.exports = {
  addReview,
  getReviews,
  delReview,
};
