const { ObjectId } = require('mongodb');
const errorResponse = require('../utils/error.utils');
const asyncHandler = require('../middlewares/async.middleware');

// Packages
const mongoose = require('mongoose');

// Repository
const Repository = require('../repository/mongoose');

// Model enums
const { DB_MODELS } = require('../utils/modelEnums');

// Logger
const logger = require('../utils/winston');

// JOI schemas
const {
  addProductSchema,
  updateProductSchema,
  findByLocationSchema,
} = require('../joi/products');
const Address = require('../models/address.model');
const {
  ADDRESS_TYPE,
  PRODUCT_STATUS,
  USER_ROLE,
  DISTANCE_UNIT,
} = require('../utils/enums');

const getProducts = asyncHandler(async (req, res, next) => {
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

    // const filteredResults = await filterHelper({
    //   model: Product,
    //   populate,
    //   select,
    //   sort,
    //   page,
    //   limit,
    //   attributes,
    //   reqQuery: req.query,
    // });

    const { data: fetchedProducts, error: errFetchingProducts } =
      await Repository.fetchAll(
        {
          modelName: DB_MODELS.product,
          query: queryString,
          include: ['product_address', 'seller'],
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

    if (errFetchingProducts) {
      await session.abortTransaction();
      logger.error('Error fetching products: ', errFetchingProducts);
      return next(new errorResponse('Error fetching products ', 500));
    }

    await session.commitTransaction();
    res.status(200).json({
      success: true,
      count: fetchedProducts.count,
      data: fetchedProducts,
    });
  } catch (err) {
    await session.abortTransaction();
    logger.error('Error fetching products: ', err);
    return next(new errorResponse(`Error fetching products: ${err}`, 500));
  } finally {
    session.endSession();
  }
});

const addProduct = asyncHandler(async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    if (
      req.user.role == 'seller' &&
      (req.body.images ||
        req.body.status ||
        req.body.average_rating ||
        req.body.add_request)
    ) {
      await session.abortTransaction();
      return next(new errorResponse('Not authorized to update these', 401));
    }

    req.body.longitude = req.body.loc ? req.body.loc.coordinates[0] : 0;
    req.body.latitude = req.body.loc ? req.body.loc.coordinates[1] : 0;

    if (!req.body._id) {
      // Add user to body
      req.body.seller = req.user.id;
      const joiValidation = addProductSchema.validate(req.body);
      if (joiValidation.error) {
        await session.abortTransaction();
        return next(
          new errorResponse(joiValidation.error.details[0].message, 400)
        );
      }

      const createAddressObj = {
        ...req.body.product_address,
        address_type: ADDRESS_TYPE.PRODUCT_ADDRESS,
        primary: true,
        name: req.user.first_name,
        user: req.user._id,
        phone: req.user.phone
      };


      const { data: createdProductAddress, error: errCreatingProductAdd } =
        await Repository.create(
          {
            modelName: DB_MODELS.address,
            createObject: createAddressObj,
            t: session,
          },
          logger
        );
        
      if (errCreatingProductAdd) {
        await session.abortTransaction();
        logger.error('Error creating product address: ', errCreatingProductAdd);
        return next(new errorResponse('Error adding product ', 500));
      }

      req.body.product_address = createdProductAddress._id;

      const createProductObj = {
        ...req.body,
        product_address: createdProductAddress._id,
        seller: req.user._id
      };      
      const { data: createdProduct, error: errCreatingProduct } =
        await Repository.create(
          {
            modelName: DB_MODELS.product,
            createObject: createProductObj,
            t: session,
          },
          logger
        );
      
      if (errCreatingProduct && errCreatingProduct!="") {
        await session.abortTransaction();
        logger.error('Error creating product: ', typeof(errCreatingProduct));
        return next(new errorResponse('Error adding product ', 500));
      }

      await session.commitTransaction();
      return res.status(201).json({
        success: true,
        message: 'Success adding product, It is in Waiting for approval state!',
        product: createdProduct,
      });
    } else {
      const joiValidation = updateProductSchema.validate(req.body);
      if (joiValidation.error) {
        await session.abortTransaction();
        return next(
          new errorResponse(joiValidation.error.details[0].message, 400)
        );
      }

      const { data: fetchedProduct, error: errFetchingProduct } =
        await Repository.fetchById({
          modelName: DB_MODELS.product,
          query: {
            id: req.body._id,
          },
          extras: {
            attributes: ['seller', 'status'],
          },
        });

      if (!fetchedProduct) {
        await session.abortTransaction();
        return next(
          new errorResponse(
            `Error resource not found of id ${req.body._id}`,
            404
          )
        );
      }

      if (
        req.user.role != USER_ROLE.ADMIN &&
        fetchedProduct.status.state == PRODUCT_STATUS.WAITING_FOR_APPROVAL
      ) {
        await session.abortTransaction();
        return next(
          new errorResponse(
            'Error product cant be updated it is in waiting state',
            500
          )
        );
      }

      // making sure that only the product seller or admin can update product details
      if (
        fetchedProduct.seller.toString() !== req.user.id &&
        req.user.role !== USER_ROLE.ADMIN
      ) {
        await session.abortTransaction();
        return next(
          new errorResponse(
            `Error ${req.user.name} is not allowed to update this product details`,
            401
          )
        );
      }
      // Update Product
      const { data: updatedProduct, error: errUpdatingProduct } =
        await Repository.updateOne(
          {
            modelName: DB_MODELS.product,
            query: {
              _id: req.body._id,
            },
            updateObject: req.body,
            t: session,
          },
          logger
        );

      if (errUpdatingProduct) {
        await session.abortTransaction();
        logger.error('Error updating product: ', errUpdatingProduct);
        return next(new errorResponse('Error updating product ', 500));
      }

      await session.commitTransaction();
      return res.status(200).json({
        success: true,
        message: 'Success updating product',
      });
    }
  } catch (err) {
    await session.abortTransaction();
    logger.error('Error adding product: ', err);
    return next(new errorResponse(`Error adding product: ${err}`, 500));
  } finally {
    session.endSession();
  }
});

const getProduct = asyncHandler(async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { productId } = req.params;

    const { data: fetchedProduct, error: errFetchingProduct } =
      await Repository.fetchById(
        {
          modelName: DB_MODELS.product,
          query: {
            id: productId,
          },
          t: session,
        },
        logger
      );

    if (errFetchingProduct) {
      await session.abortTransaction();
      logger.error('Error fetching product: ', errFetchingProduct);
      return next(new errorResponse('Error fetching product ', 500));
    }

    if (!fetchedProduct) {
      await session.abortTransaction();
      return next(
        new errorResponse(`Resource not found of id ${productId}`, 404)
      );
    }

    await session.commitTransaction();
    return res.status(201).json({
      success: true,
      data: fetchedProduct,
    });
  } catch (err) {
    await session.abortTransaction();
    logger.error('Error fetching product: ', err);
    return next(new errorResponse(`Error fetching product: ${err}`, 500));
  } finally {
    session.endSession();
  }
});

const deleteProduct = asyncHandler(async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { productId } = req.params;

    const { data: fetchedProduct, error: errFetchingProduct } =
      await Repository.fetchById(
        {
          modelName: DB_MODELS.product,
          query: {
            id: productId,
          },
          t: session,
        },
        logger
      );

    if (errFetchingProduct) {
      await session.abortTransaction();
      logger.error('Error fetching product: ', errFetchingProduct);
      return next(new errorResponse('Error fetching product ', 500));
    }

    if (!fetchedProduct) {
      await session.abortTransaction();
      return next(
        new errorResponse(`Resource not found of id ${productId}`, 404)
      );
    }
    // making sure that only the product seller or admin can delete product details
    if (
      fetchedProduct.seller.toString() !== req.user.id &&
      req.user.role !== USER_ROLE.ADMIN
    ) {
      await session.abortTransaction();
      return next(
        new errorResponse(
          `${req.user.name} is not allowed to delete this product details`,
          401
        )
      );
    }

    // Delete the product
    const { data: deletedProduct, error: errDeletingProduct } =
      await Repository.destroy(
        {
          modelName: DB_MODELS.product,
          query: {
            id: productId,
          },
          t: session,
        },
        logger
      );

    if (errDeletingProduct) {
      await session.abortTransaction();
      logger.error('Error deleting product: ', errDeletingProduct);
      return next(new errorResponse('Error deleting product ', 500));
    }

    await session.commitTransaction();
    return res.status(200).json({
      success: true,
      message: 'Success deleting',
    });
  } catch (err) {
    await session.abortTransaction();
    logger.error('Error deleting product: ', err);
    return next(new errorResponse(`Error deleting product: ${err}`, 500));
  } finally {
    session.endSession();
  }
});

const addToWishlist = asyncHandler(async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { productId } = req.params;
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
      return next(new errorResponse('Error adding product to wishlist', 500));
    }

    const { data: theWishlist, error: errFetchingWishlist } =
      await Repository.fetchById(
        {
          modelName: DB_MODELS.wishlist,
          query: {
            id: theUser.wishlist[0],
          },
          t: session,
        },
        logger
      );

    if (errFetchingWishlist) {
      await session.abortTransaction();
      return next(new errorResponse('Error adding product to wishlist', 500));
    }

    const { data: fetchedProduct, error: errFetchingProduct } =
      await Repository.fetchById(
        {
          modelName: DB_MODELS.product,
          query: {
            id: productId,
          },
          extras: {
            attributes: ['title', '_id'],
          },
          t: session,
        },
        logger
      );

    if (errFetchingProduct) {
      await session.abortTransaction();
      logger.error('Error fetching product: ', errFetchingProduct);
      return next(new errorResponse('Error fetching product ', 500));
    }

    if (!fetchedProduct) {
      await session.abortTransaction();
      return next(
        new errorResponse(`Resource not found of id ${productId}`, 404)
      );
    }

    if (theWishlist) {
      let wishlistProducts = theWishlist.products;
      const productIdObj = ObjectId(req.params.productId);
      if (wishlistProducts.includes(productIdObj)) {
        await session.abortTransaction();
        return next(new errorResponse('Product already in Wishlist', 200));
      }

      wishlistProducts.push(productId);
      theWishlist.products = wishlistProducts;
      theWishlist.save();
      await session.commitTransaction();
      return res.status(200).json({
        success: true,
        message: 'Success adding product to theWishlist',
        body: theWishlist,
      });
    } else {
      const createObject = {
        products: [productId],
        name: theUser.first_name + ' wishlist',
      };

      const { data: createdWishlist, error: errCreatingWishlist } =
        await Repository.create(
          {
            modelName: DB_MODELS.wishlist,
            createObject,
            t: session,
          },
          logger
        );

      if (errCreatingWishlist) {
        await session.abortTransaction();
        logger.error('Error creating wishlist product: ', errCreatingWishlist);
        return next(new errorResponse('Error creating wishlist product ', 500));
      }

      theUser.wishlist.push(createdWishlist._id);
      theUser.save();

      await session.commitTransaction();
      return res.status(200).json({
        success: true,
        message: 'Success wishlist created and Product added',
        body: createdWishlist,
      });
    }
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

const addToCart = asyncHandler(async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const productId = req.params.productId;
    const { data: theUser, error: errFetchingUser } =
      await Repository.fetchById(
        {
          modelName: DB_MODELS.user,
          query: {
            id: req.user.id,
          },
          include: ['cart.coupon_applied'],
          t: session,
        },
        logger
      );

    if (errFetchingUser) {
      await session.abortTransaction();
      return next(new errorResponse(errFetchingUser, 500));
    }

    const userCart = theUser.cart;

    const { data: fetchedProduct, error: errFetchingProduct } =
      await Repository.fetchById(
        {
          modelName: DB_MODELS.product,
          query: {
            id: productId,
          },
          t: session,
        },
        logger
      );

    if (errFetchingProduct) {
      await session.abortTransaction();
      return next(new errorResponse(errFetchingProduct, 500));
    }

    if (!fetchedProduct) {
      await session.abortTransaction();
      return next(new errorResponse('Error product not found', 404));
    }

    // if (cart) {
    if (userCart.items.length === 0) {
      userCart.items.push({
        product: productId,
        qty: 1,
        price: fetchedProduct.cost,
      });
    } else {
      let i = 0;
      for (i = 0; i < userCart.items.length; i++) {
        if (productId == userCart.items[i].product)
          return next(new errorResponse('Error product already added', 400));
      }
      if (userCart.items.length == i) {
        userCart.items.push({
          product: productId,
          qty: 1,
          price: fetchedProduct.cost,
        });
      }
    }
    // const productId = ObjectId(req.params.productId);
    // // let isin = 0;
    // // items.forEach((item) => {
    // //   if (item.product === productId) {
    // //     isin = 1;
    // //     item.qty = item.qty + 1;
    // //     userCart[0].total_qty += 1;
    // //     userCart[0].total_price += product.cost;
    // //     userCart[0].save();
    // //   }
    // // });
    // // if (isin == 1) {
    // //   return res.status(200).json({
    // //     success: true,
    // //     message: 'Product added to Cart',
    // //     data: userCart,
    // //   });
    // // }
    // userCart.items.push({
    // 	product: req.params.productId,
    // 	qty: 1,
    // 	price: product.cost,
    // });
    userCart.total_qty += 1;
    userCart.total_price += product.cost;
    if (userCart.coupon_applied)
      userCart.discounted_price =
        userCart.total_price -
        (userCart.coupon_applied.value * userCart.total_price) / 100;

    theUser.cart = userCart;
    theUser.save();
    // } else {
    //   let items = [
    //     {
    //       product: req.params.productId,
    //       qty: 1,
    //       price: product.cost,
    //     },
    //   ];
    //   userCart = await Cart.create({
    //     user: req.user.id,
    //     items: items,
    //     total_qty: 1,
    //     total_price: product.cost,
    //   });
    // }

    await session.commitTransaction();
    return res.status(200).json({
      success: true,
      message: 'Success adding to Cart',
      data: userCart,
    });
  } catch (err) {
    await session.abortTransaction();
    logger.error('Error adding product to cart: ', err);
    return next(new errorResponse(`Error adding product to cart: ${err}`, 500));
  } finally {
    session.endSession();
  }
});

const uploadImages = asyncHandler(async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const results = res.imgres;
    const { productId } = req.params;
    const { data: fetchedProduct, error: errFetchingProduct } =
      await Repository.fetchById(
        {
          modelName: DB_MODELS.product,
          query: {
            id: productId,
          },
          t: session,
        },
        logger
      );

    if (errFetchingProduct) {
      await session.abortTransaction();
      return next(new errorResponse(errFetchingProduct, 500));
    }

    if (!fetchedProduct) {
      await session.abortTransaction();
      return next(new errorResponse('Error product not found', 404));
    }
    // making sure that only the product seller or admin can update product details
    if (
      fetchedProduct.seller.toString() !== req.user.id &&
      req.user.role !== USER_ROLE.ADMIN
    ) {
      await session.abortTransaction();
      return next(
        new errorResponse(
          `${req.user.name} is not allowed to update this product details`,
          401
        )
      );
    }

    // if (!results.length && product.images.length < 5)
    //   product.images.push(results.secure_url);
    // else if (!results.length && product.images.length >= 5)
    //   return next(new errorResponse('Product already has 5 images: ', 400));
    if (results.length) {
      // product.images = [];
      // for (let i = 0; i < results.length; i++)
      //   product.images.push(results[i].secure_url);
      fetchedProduct.images = results.map((elem) => {
        return elem.secure_url;
      });
    }

    await fetchedProduct.save();
    await session.commitTransaction();
    return res.status(200).json({
      success: true,
      data: fetchedProduct,
    });
  } catch (err) {
    await session.abortTransaction();
    logger.error('Error uploading images: ', err);
    return next(new errorResponse(`Error uploading images: ${err}`, 500));
  } finally {
    session.endSession();
  }
});

const findByLocation = async (req, res, next) => {
  // Get longitude and latitude from geocoder through zipcode
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
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
    if (unit === DISTANCE_UNIT.KM || unit === DISTANCE_UNIT.KILOMETER) {
      radius = distance / 6378;
    } else if (unit === DISTANCE_UNIT.MI || unit === DISTANCE_UNIT.MILES) {
      radius = distance / 3963;
    } else {
      res.status(400).json({
        success: false,
        error: 'Wrong unit provided',
      });
      return;
    }
    // const products = await Product.find({
    // loc: {
    //   $geoWithin: {
    //     $centerSphere: [[lng, lat], radius],
    //   },
    // },
    // });

    const { data: locationProducts, error: errFetchingProducts } =
      await Repository.fetchAll(
        {
          modelName: DB_MODELS.product,
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

    if (errFetchingProducts) {
      await session.abortTransaction();
      return next(new errorResponse('Error fetching products: ', 500));
    }

    await session.commitTransaction();
    return res.status(200).json({
      success: true,
      count: locationProducts.length,
      data: locationProducts,
    });
  } catch (err) {
    await session.abortTransaction();
    logger.error('Error fetching product: ', err);
    return next(new errorResponse(`Error fetching product: ${err}`, 500));
  } finally {
    session.endSession();
  }
};

module.exports = {
  getProducts,
  getProduct,
  addProduct,
  deleteProduct,
  addToWishlist,
  addToCart,
  uploadImages,
  findByLocation,
};
