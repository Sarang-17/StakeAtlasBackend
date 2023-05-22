const errorResponse = require('../utils/error.utils');
const asyncHandler = require('../middlewares/async.middleware');

// Logger
const logger = require('../utils/winston');

// Repo
const Repository = require('../repository/mongoose');

// Packages
const mongoose = require('mongoose');

// Enums
const { DB_MODELS } = require('../utils/modelEnums');

// Import joi
const {
  createModelSchema,
  updateModelSchema,
  addSpecificationSchema,
} = require('../joi/model');

const createModel = asyncHandler(async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    if (!req.body._id) {
      const joiValidation = createModelSchema.validate(req.body);
      if (joiValidation.error) {
        await session.abortTransaction();
        return next(
          new errorResponse(joiValidation.error.details[0].message, 400)
        );
      }
      delete req.body.category;

      const { data: createdModel, error: errCreatingModel } =
        await Repository.create(
          {
            modelName: DB_MODELS.model,
            createObject: req.body,
            t: session,
          },
          logger
        );

      if (errCreatingModel) {
        await session.abortTransaction();
        logger.error('Error creating model: ', errCreatingModel);
        return next(new errorResponse('Error creating model ', 500));
      }

      await session.commitTransaction();
      return res.status(200).json({
        success: true,
        data: createdModel,
      });
    } else {
      const joiValidation = updateModelSchema.validate(req.body);
      if (joiValidation.error) {
        await session.abortTransaction();
        return next(
          new errorResponse(joiValidation.error.details[0].message, 400)
        );
      }

      // const updatedModel = await Model.findByIdAndUpdate(
      //   req.body._id,
      //   req.body,
      //   {
      //     runValidators: true,
      //     new: true,
      //   }
      // );

      // if (!updatedModel) return next(new errorResponse('Model not found', 404));

      const { data: updatedModel, error: errUpdatingModel } =
        await Repository.updateOne(
          {
            modelName: DB_MODELS.model,
            query: {
              _id: req.body._id,
            },
            updateObject: req.body,
            t: session,
          },
          logger
        );

      if (errUpdatingModel) {
        await session.abortTransaction();
        logger.error('Error updating model: ', errUpdatingModel);
        return next(new errorResponse('Error updating model ', 500));
      }

      await session.commitTransaction();
      return res.status(200).json({
        success: true,
        message: 'Success updating model',
      });
    }
  } catch (err) {
    await session.abortTransaction();
    logger.error('Error creating model: ', err);
    return next(new errorResponse(`Error creating model: ${err}`, 500));
  } finally {
    session.endSession();
  }
});

const getModels = asyncHandler(async (req, res, next) => {
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

    const { data: fetchedModels, error: errFetchingModels } =
      await Repository.fetchAll(
        {
          modelName: DB_MODELS.model,
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

    if (errFetchingModels) {
      await session.abortTransaction();
      logger.error('Error fetching model: ', errFetchingModels);
      return next(new errorResponse('Error fetching model ', 500));
    }

    await session.commitTransaction();
    res.status(200).json({
      success: true,
      count: fetchedModels.count,
      data: fetchedModels,
    });
  } catch (err) {
    await session.abortTransaction();
    logger.error('Error fetching models: ', err);
    return next(new errorResponse(`Error fetching models: ${err}`, 500));
  } finally {
    session.endSession();
  }
});

const addImage = asyncHandler(async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { modelId } = req.params;
    const results = res.imgres;
    // const model = await Model.findById(modelId);

    // if (!model)
    //   return next(
    //     new errorResponse(`Resource not found of id ${modelId}`, 404)
    //   );

    // model.model_image = results[0].mediaSource;
    // await model.save();
    const { data: updatedModel, error: errUpdatingModel } =
      await Repository.updateOne(
        {
          modelName: DB_MODELS.model,
          query: {
            _id: modelId,
          },
          updateObject: {
            model_image: results[0].mediaSource,
          },
          t: session,
        },
        logger
      );

    if (errUpdatingModel) {
      await session.abortTransaction();
      logger.error('Error updating model: ', errUpdatingModel);
      return next(new errorResponse('Error adding image to model ', 500));
    }

    await session.commitTransaction();
    return res.status(200).json({
      success: true,
      data: 'Success adding image',
    });
  } catch (err) {
    await session.abortTransaction();
    logger.error('Error adding image: ', err);
    return next(new errorResponse(`Error adding image: ${err}`, 500));
  } finally {
    session.endSession();
  }
});

const addSpecification = asyncHandler(async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const joiValidation = addSpecificationSchema.validate(req.body);
    if (joiValidation.error) {
      await session.abortTransaction();
      return next(
        new errorResponse(joiValidation.error.details[0].message, 400)
      );
    }

    const { modelId } = req.body;
    delete req.body.modelId;
    // const createdSpecification = await Specification.create(req.body);

    // const theUpdatedModel = await Model.findByIdAndUpdate(modelId, req.body, {
    //   runValidators: true,
    //   new: true,
    // });

    const { data: updatedModel, error: errUpdatingModel } =
      await Repository.updateOne(
        {
          modelName: DB_MODELS.model,
          query: {
            _id: modelId,
          },
          updateObject: req.body,
          t: session,
        },
        logger
      );

    if (errUpdatingModel) {
      await session.abortTransaction();
      logger.error('Error updating model: ', errUpdatingModel);
      return next(
        new errorResponse('Error adding specification to model ', 500)
      );
    }

    return res.status(201).json({
      success: true,
      message: 'Success adding specification',
      data: updatedModel,
    });
  } catch (err) {
    await session.abortTransaction();
    logger.error('Error adding specification: ', err);
    return next(new errorResponse(`Error adding specification: ${err}`, 500));
  } finally {
    session.endSession();
  }
});

const getSpecification = asyncHandler(async (req, res, next) => {
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

    const { data: fetchedSpecifications, error: errFetchingSpecifications } =
      await Repository.fetchAll(
        {
          modelName: DB_MODELS.specification,
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

    if (errFetchingSpecifications) {
      await session.abortTransaction();
      logger.error(
        'Error fetching specifications: ',
        errFetchingSpecifications
      );
      return next(new errorResponse('Error fetching specifications ', 500));
    }

    await session.commitTransaction();
    res.status(200).json({
      success: true,
      count: fetchedSpecifications.count,
      data: fetchedSpecifications,
    });
  } catch (err) {
    await session.abortTransaction();
    logger.error('Error fetching specificationss: ', err);
    return next(
      new errorResponse(`Error fetching specificationss: ${err}`, 500)
    );
  } finally {
    session.endSession();
  }
});

module.exports = {
  getModels,
  getSpecification,
  addSpecification,
  addImage,
  createModel,
};
