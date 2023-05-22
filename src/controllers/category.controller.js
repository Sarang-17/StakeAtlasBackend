const errorResponse = require('../utils/error.utils');
const asyncHandler = require('../middlewares/async.middleware');

// package
const mongoose = require('mongoose');

// Repository
const Repository = require('../repository/mongoose');

// JOI schema
const {
  createCategorySchema,
  updateCategorySchema,
  createSubCategorySchema,
  updateSubCategorySchema,
} = require('../joi/category');
const { DB_MODELS } = require('../utils/modelEnums');
const logger = require('../utils/winston');

const createCategory = asyncHandler(async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    if (!req.body._id) {
      const joiValidation = createCategorySchema.validate(req.body);
      if (joiValidation.error) {
        await session.abortTransaction();
        return next(
          new errorResponse(joiValidation.error.details[0].message, 400)
        );
      }

      const { data: createdCategory, error: errCreatingCategory } =
        await Repository.create(
          {
            modelName: DB_MODELS.category,
            createObject: req.body,
            t: session,
          },
          logger
        );

      if (errCreatingCategory) {
        await session.abortTransaction();
        logger.error('Error creating category: ', errCreatingCategory);
        return next(new errorResponse('Error creating category: ', 500));
      }

      await session.commitTransaction();
      return res.status(201).json({
        success: true,
        message: 'Success creating category',
        data: createdCategory,
      });
    } else {
      const joiValidation = updateCategorySchema.validate(req.body);
      if (joiValidation.error) {
        await session.abortTransaction();
        return next(
          new errorResponse(joiValidation.error.details[0].message, 400)
        );
      }
      // const updatedCategory = await Category.findByIdAndUpdate(
      //   req.body._id,
      //   req.body,
      //   {
      //     new: true,
      //     runValidators: true,
      //   }
      // );

      const { data: updatedCategory, error: errUpdatingCategory } =
        await Repository.updateOne(
          {
            modelName: DB_MODELS.category,
            query: {
              _id: req.body._id,
            },
            updateObject: req.body,
            t: session,
          },
          logger
        );

      if (errUpdatingCategory) {
        await session.abortTransaction();
        logger.error('Error updating category: ', errUpdatingCategory);
        return next(new errorResponse('Error updating category: ', 500));
      }

      await session.commitTransaction();
      return res.status(200).json({
        success: true,
        message: 'Category updated',
      });
    }
  } catch (err) {
    await session.abortTransaction();
    logger.error('Error creating category: ', err);
    return next(new errorResponse('Error creating category', 500));
  } finally {
    session.endSession();
  }
});

const addImage = asyncHandler(async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { categoryId } = req.params;
    const result = res.imgres;
    const { data: fetchedCategory, error: errFetchingCategory } =
      await Repository.updateOne(
        {
          modelName: DB_MODELS.category,
          query: {
            _id: categoryId,
            updateObject: {
              image: result.secure_url,
            },
          },
          t: session,
        },
        logger
      );

    if (errFetchingCategory) {
      await session.abortTransaction();
      logger.error('Error adding image to category: ', errFetchingCategory);
      return next(new errorResponse('Error adding image to category: ', 500));
    }

    await session.commitTransaction();
    res.status(200).json({
      success: true,
      data: fetchedCategory,
    });
  } catch (err) {
    await session.abortTransaction();
    logger.error('Error adding image to category: ', err);
    return next(new errorResponse('Error adding image to category', 500));
  } finally {
    session.endSession();
  }
});

const addSubCategory = asyncHandler(async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { categoryId } = req.params;
    if (!req.body._id) {
      const joiValidation = createSubCategorySchema.validate(req.body);
      if (joiValidation.error) {
        await session.abortTransaction();
        return next(
          new errorResponse(joiValidation.error.details[0].message, 400)
        );
      }

      const createObject = {
        ...req.body,
        is_subcategory: true,
      };
      const { data: createdSubCategory, error: errCreatingSubcategory } =
        await Repository.create(
          {
            modelName: DB_MODELS.category,
            createObject,
            t: session,
          },
          logger
        );

      if (errCreatingSubcategory) {
        await session.abortTransaction();
        logger.error('Error creating subcategory: ', errCreatingSubcategory);
        return next(new errorResponse('Error creating subcategory: ', 500));
      }

      const { data: fetchedCategory, error: errFetchingCategory } =
        await Repository.fetchById(
          {
            modelName: DB_MODELS.category,
            query: {
              id: categoryId,
            },
            t: session,
          },
          logger
        );

      if (errFetchingCategory) {
        await session.abortTransaction();
        logger.error('Error fetching category: ', errFetchingCategory);
        return next(new errorResponse('Error fetching category: ', 500));
      }

      fetchedCategory.sub_categories.push(createdSubCategory._id);
      await fetchedCategory.save();
    } else {
      const joiValidation = updateSubCategorySchema.validate(req.body);
      if (joiValidation.error) {
        await session.abortTransaction();
        return next(
          new errorResponse(joiValidation.error.details[0].message, 400)
        );
      }

      // const updatedSubcategory = await Category.findByIdAndUpdate(
      //   req.body._id,
      //   req.body,
      //   {
      //     new: true,
      //     runValidators: true,
      //   }
      // );

      const { data: updatedSubcategory, error: errUpdatingSubCategory } =
        await Repository.updateOne(
          {
            modelName: DB_MODELS.category,
            query: {
              _id: req.body._id,
            },
            updateObject: req.body,
            t: session,
          },
          logger
        );

      if (errUpdatingSubCategory) {
        await session.abortTransaction();
        logger.error('Error updating subcategory: ', errUpdatingSubCategory);
        return next(new errorResponse('Error creating category: ', 500));
      }
    }

    await session.commitTransaction();
    return res.status(200).json({
      success: true,
      message: 'Category updated',
    });
  } catch (err) {
    await session.abortTransaction();
    logger.error('Error adding subcategory: ', err);
    return next(new errorResponse('Error adding subcategory', 500));
  } finally {
    session.endSession();
  }
});

const getAllCategories = asyncHandler(async (req, res, next) => {
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

    const { data: fetchedCategories, error: errFetchingCategories } =
      await Repository.fetchAll(
        {
          modelName: DB_MODELS.category,
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

    if (errFetchingCategories) {
      await session.abortTransaction();
      logger.error('Error fetching categoies: ', errFetchingCategories);
      return next(new errorResponse('Error fetching categoies ', 500));
    }

    await session.commitTransaction();
    res.status(200).json({
      success: true,
      count: fetchedCategories.count,
      data: fetchedCategories,
    });
  } catch (err) {
    await session.abortTransaction();
    logger.error('Error fetching categoies: ', err);
    return next(new errorResponse(`Error fetching categoies: ${err}`, 500));
  } finally {
    session.endSession();
  }
});

module.exports = {
  createCategory,
  addImage,
  addSubCategory,
  getAllCategories,
};
