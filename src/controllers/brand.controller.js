const errorResponse = require('../utils/error.utils');
const asyncHandler = require('../middlewares/async.middleware');

// Repository
const Repository = require('../repository/mongoose');

// packages
const mongoose = require('mongoose');
const { DB_MODELS } = require('../utils/modelEnums');
const logger = require('../utils/winston');

const createBrand = asyncHandler(async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { _id, brand_name, brand_country, category } = req.body;

    if (!_id) {
      const { data: createdBrand, error: errCreatingBrand } =
        await Repository.create(
          {
            modelName: DB_MODELS.brand,
            createObject: {
              brand_name,
              brand_country,
              category,
            },
            t: session,
          },
          logger
        );

      if (errCreatingBrand) {
        await session.abortTransaction();
        logger.error('Error creating brand: ', errCreatingBrand);
        return next(new errorResponse('Error creating brand ', 500));
      }

      await session.commitTransaction();
      return res.status(200).json({
        success: true,
        data: createdBrand,
      });
    } else {
      const { data: updatedBrand, error: errUpdatingBrand } =
        await Repository.updateOne(
          {
            modelName: DB_MODELS.brand,
            query: {
              _id,
            },
            updateObject: {
              brand_name,
              brand_country,
              category,
            },
            t: session,
          },
          logger
        );

      if (errUpdatingBrand) {
        await session.abortTransaction();
        logger.error('Error updating brand: ', errUpdatingBrand);
        return next(new errorResponse('Error updating brand ', 500));
      }

      await session.commitTransaction();
      return res.status(200).json({
        success: true,
        message: 'Brand updated',
      });
    }
  } catch (err) {
    await session.abortTransaction();
    logger.error('Error creating brand: ', err);
    return next(new errorResponse(`Error creating brand: ${err}`, 500));
  } finally {
    session.endSession();
  }
});

const getBrands = asyncHandler(async (req, res, next) => {
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

    const { data: fetchedBrands, error: errFetchingBrands } =
      await Repository.fetchAll(
        {
          modelName: DB_MODELS.brand,
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

    if (errFetchingBrands) {
      await session.abortTransaction();
      logger.error('Error fetching brand: ', errFetchingBrands);
      return next(new errorResponse('Error fetching brand ', 500));
    }

    await session.commitTransaction();
    res.status(200).json({
      success: true,
      count: fetchedBrands.count,
      data: fetchedBrands,
    });
  } catch (err) {
    await session.abortTransaction();
    logger.error('Error fetching brands: ', err);
    return next(new errorResponse(`Error fetching brands: ${err}`, 500));
  } finally {
    session.endSession();
  }
});

const addImage = asyncHandler(async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { brandId } = req.params;
    const result = res.imgres;
    // const brand = await Brand.findById(brandId);

    // if (!brand)
    //   return next(
    //     new errorResponse(`Resource not found of id ${brandId}`, 404)
    //   );

    // brand.brand_image = result.secure_url;
    // await brand.save();

    const { data: updatedBrand, error: errUpdatingBrand } =
      await Repository.updateOne(
        {
          modelName: DB_MODELS.brand,
          query: {
            _id: brandId,
          },
          updateObject: {
            brand_image: result.secure_url,
          },
          t: session,
        },
        logger
      );

    if (errUpdatingBrand) {
      await session.abortTransaction();
      logger.error('Error updating brand: ', errUpdatingBrand);
      return next(new errorResponse('Error adding image to brand ', 500));
    }

    res.status(200).json({
      success: true,
      data: updatedBrand,
    });
  } catch (err) {
    await session.abortTransaction();
    logger.error('Error adding image: ', err);
    return next(new errorResponse(`Error adding image: ${err}`, 500));
  } finally {
    session.endSession();
  }
});

module.exports = {
  createBrand,
  getBrands,
  addImage,
};
