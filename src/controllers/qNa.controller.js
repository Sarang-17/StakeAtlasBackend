const QnA = require('../models/qNa.model');
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

const askQue = asyncHandler(async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { question, product } = req.body;
    const createObject = {
      question_by: req.user.id,
      question,
      product,
    };

    const { data: createdQna, error: errCreatingQna } = await Repository.create(
      {
        modelName: DB_MODELS.qna,
        createObject,
        t: session,
      },
      logger
    );

    if (errCreatingQna) {
      await session.abortTransaction();
      return next(new errorResponse(res, 'Error creating qna', 500));
    }

    await session.commitTransaction();
    res.status(200).json({
      success: true,
      message: 'Question posted',
      data: createdQna,
    });
  } catch (err) {
    await session.abortTransaction();
    logger.error('Error creating wishlist product: ', err);
    return next(
      new errorResponse(`Error creating wishlist product: ${err}`, 500)
    );
  } finally {
    session.endSession();
  }
});

const ansQue = asyncHandler(async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { ans, qnaId } = req.body;

    const { data: existingQna, error: errFetchingQna } =
      await Repository.fetchById(
        {
          modelName: DB_MODELS.qna,
          query: {
            id: qnaId,
          },
          t: session,
        },
        logger
      );

    if (errFetchingQna) {
      await session.abortTransaction();
      return next(new errorResponse(res, 'Error fetching qna', 500));
    }

    if (!existingQna) {
      await session.abortTransaction();
      return next(new errorResponse('Question not found', 404));
    }

    const { data: fetchedProduct, error: errFetchingProduct } =
      await Repository.fetchById(
        {
          modelName: DB_MODELS.product,
          query: {
            id: existingQna.product,
          },
          extras: {
            attributes: ['seller'],
          },
          t: session,
        },
        logger
      );

    if (errFetchingProduct) {
      await session.abortTransaction();
      logger.error('Error fetching product: ', errFetchingProduct);
      return next(new errorResponse('Error answering question ', 500));
    }

    let tag = USER_ROLE.USER;
    if (fetchedProduct.seller.toString() == req.user.id) tag = USER_ROLE.SELLER;

    const answerObj = {
      ans,
      answered_by: req.user.id,
      tag: tag,
    };

    existingQna.answer = answerObj;
    await existingQna.save();

    await session.commitTransaction();
    return res.status(200).json({
      success: true,
      message: 'Answer posted successfully',
      data: existingQna,
    });
  } catch (err) {
    await session.abortTransaction();
    logger.error('Error answering question: ', err);
    return next(new errorResponse(`Error answering question: ${err}`, 500));
  } finally {
    session.endSession();
  }
});

const getQnA = asyncHandler(async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const productId = req.params.productId;
    const { data: existingQnas, error: errFetchingQna } =
      await Repository.fetchAll(
        {
          modelName: DB_MODELS.qna,
          query: {
            product: productId,
          },
          t: session,
        },
        logger
      );

    if (errFetchingQna) {
      await session.abortTransaction();
      return next(new errorResponse(res, 'Error fetching qna', 500));
    }

    await session.commitTransaction();
    return res.status(200).json({
      success: true,
      data: existingQnas,
    });
  } catch (err) {
    await session.abortTransaction();
    logger.error('Error getting qnas: ', err);
    return next(new errorResponse(`Error getting qnas: ${err}`, 500));
  } finally {
    session.endSession();
  }
});

const deleteQue = asyncHandler(async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { qnaId } = req.params;

    const { data: existingQna, error: errFetchingQna } =
      await Repository.fetchById(
        {
          modelName: DB_MODELS.qna,
          query: {
            id: qnaId,
          },
          t: session,
        },
        logger
      );

    if (errFetchingQna) {
      await session.abortTransaction();
      return next(new errorResponse(res, 'Error fetching qna', 500));
    }

    if (!existingQna) {
      await session.abortTransaction();
      return next(new errorResponse('Question not found', 404));
    }

    const { data: fetchedProduct, error: errFetchingProduct } =
      await Repository.fetchById(
        {
          modelName: DB_MODELS.product,
          query: {
            id: existingQna.product,
          },
          extras: {
            attributes: ['seller'],
          },
          t: session,
        },
        logger
      );

    if (errFetchingProduct) {
      await session.abortTransaction();
      logger.error('Error fetching product: ', errFetchingProduct);
      return next(new errorResponse('Error deleting qna ', 500));
    }

    if (
      fetchedProduct.seller.toString() !== req.user.id &&
      req.user.role !== USER_ROLE.ADMIN
    ) {
      await session.abortTransaction();
      return next(
        new errorResponse(
          `${req.user.name} is not allowed to delete question`,
          401
        )
      );
    }

    const { data: deletedQna, error: errDeletingQna } =
      await Repository.destroy(
        {
          modelName: DB_MODELS.qna,
          query: {
            id: qnaId,
          },
          t: session,
        },
        logger
      );

    if (errDeletingQna) {
      await session.abortTransaction();
      logger.error('Error deleting qna: ', errDeletingQna);
      return next(new errorResponse('Error deleting qna ', 500));
    }

    await session.commitTransaction();
    return res.status(200).json({
      success: true,
      message: 'Deleted successfully',
    });
  } catch (err) {
    await session.abortTransaction();
    logger.error('Error deleting qna: ', err);
    return next(new errorResponse(`Error deleting qna: ${err}`, 500));
  } finally {
    session.endSession();
  }
});

// TODO:
const upvote = asyncHandler(async (req, res, next) => {
  const { qnaId } = req.params;

  const qna = await QnA.findById(qnaId);

  qna.answer.vote += 1;

  await qna.save();

  res.status(200).json({
    success: true,
    message: 'Upvoted',
    data: qna,
  });
});

// TODO:
const devote = asyncHandler(async (req, res, next) => {
  const { qnaId } = req.params;

  const qna = await QnA.findById(qnaId);

  qna.answer.vote -= 1;

  await qna.save();

  res.status(200).json({
    success: true,
    message: 'Devoted',
    data: qna,
  });
});

module.exports = {
  askQue,
  ansQue,
  getQnA,
  deleteQue,
  upvote,
  devote,
};
