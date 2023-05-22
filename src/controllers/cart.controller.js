const { ObjectId } = require('mongodb');
const errorResponse = require('../utils/error.utils');
const asyncHandler = require('../middlewares/async.middleware');

// Mongoose
const mongoose = require('mongoose');

// Repository
const Repository = require('../repository/mongoose');

// Model enums
const { DB_MODELS } = require('../utils/modelEnums');

// logger
const logger = require('../utils/winston');

const getItems = asyncHandler(async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { data: theUser, error: errFetchingUser } =
      await Repository.fetchById(
        {
          modelName: DB_MODELS.user,
          query: {
            id: req.user.id,
          },
          include: ['items.product'],
          t: session,
        },
        logger
      );

    if (errFetchingUser) {
      await session.abortTransaction();
      return next(new errorResponse('Error getting items', 500));
    }

    // const cart = await Cart.findOne({ user: req.user.id }).populate({
    //   path: 'items.product',
    // });

    await session.commitTransaction();
    res.status(200).json({
      success: true,
      data: theUser.cart,
    });
  } catch (err) {
    await session.abortTransaction();
    logger.error('Error getting items: ', err);
    return next(new errorResponse('Error getting items', 500));
  } finally {
    session.endSession();
  }
});

const removeItem = asyncHandler(async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    // const cart = await Cart.findOne({ user: req.user.id }).populate(
    //   'coupon_applied'
    // );
    const { data: theUser, error: errFetchingUser } =
      await Repository.fetchById(
        {
          modelName: DB_MODELS.user,
          query: {
            id: req.user.id,
          },
          include: ['cart.items.product'],
          t: session,
        },
        logger
      );

    if (errFetchingUser) {
      await session.abortTransaction();
      return next(new errorResponse(errFetchingUser, 500));
    }

    const cart = theUser.cart;

    if (!cart) {
      await session.abortTransaction();
      return next(new errorResponse('No items in the cart', 404));
    }

    // const product = await Product.findById(req.params.productId);

    const { data: product, error: errFetchingProduct } =
      await Repository.fetchById(
        {
          modelName: DB_MODELS.product,
          query: {
            id: req.params.productId,
          },
          t: session,
        },
        logger
      );

    if (errFetchingProduct) {
      await session.abortTransaction();
      return next(new errorResponse(errFetchingProduct, 500));
    }

    if (!product) {
      await session.abortTransaction();
      return next(new errorResponse('Product not found', 404));
    }

    const newitems = cart.items.filter((item) => {
      return item.product != req.params.productId;
    });
    if (newitems.length === cart.items.length) {
      await session.abortTransaction();
      return next(new errorResponse('Item not present', 404));
    }

    cart.items = newitems;
    cart.total_qty -= 1;
    cart.total_price -= product.cost;

    let couponValue;
    if (cart.coupon_applied && cart.items.length === 0) {
      // const appliedCoupon = await Coupon.findById(cart.coupon_applied._id);
      const { data: appliedCoupon, error: errGettingCoupon } =
        await Repository.fetchById(
          {
            modelName: DB_MODELS.coupon,
            query: {
              id: cart.coupon_applied,
            },
            t: session,
          },
          logger
        );

      if (errGettingCoupon) {
        await session.abortTransaction();
        logger.error('Error getting applied coupon: ', errGettingCoupon);
        return next(new errorResponse('Error removing item', 500));
      }
      appliedCoupon.qty += 1;
      cart.coupon_applied = null;
      cart.discounted_price = null;
      couponValue = appliedCoupon.value;
      await appliedCoupon.save();
    } else if (cart.coupon_applied) {
      cart.discounted_price =
        cart.total_price - (cart.total_price * couponValue) / 100;
    }

    theUser.cart = cart;
    theUser.save();

    await session.commitTransaction();
    res.status(200).json({
      success: true,
      data: cart,
    });
  } catch (err) {
    await session.abortTransaction();
    logger.error('Error removing item: ', err);
    return next(new errorResponse('Error removing item', 500));
  } finally {
    session.endSession();
  }
});

const applyCoupon = asyncHandler(async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { code, cartId } = req.body;
    // const coupon = await Coupon.findOne({ code });
    const { data: theCoupon, error: errFetchingCoupon } =
      await Repository.fetchOne(
        {
          modelName: DB_MODELS.coupon,
          query: {
            code,
          },
          t: session,
        },
        logger
      );

    if (errFetchingCoupon) {
      await session.abortTransaction();
      return next(new errorResponse(errFetchingCoupon, 500));
    }

    if (!theCoupon || theCoupon.qty == 0) {
      await session.abortTransaction();
      return next(new errorResponse('Invalid code', 400));
    }

    // const cart = await Cart.findById(cartId);
    const { data: theUser, error: errFetchingUser } =
      await Repository.fetchById(
        {
          modelName: DB_MODELS.user,
          query: {
            id: req.user.id,
          },
          t: session,
        },
        logger
      );

    if (errFetchingUser) {
      await session.abortTransaction();
      return next(new errorResponse(errFetchingUser, 500));
    }

    const cart = theUser.cart;

    if (!cart) {
      await session.abortTransaction();
      return next(new errorResponse('No items in the cart', 404));
    }

    if (cart.coupon_applied) {
      await session.abortTransaction();
      return next(new errorResponse('Coupon already applied', 404));
    }

    if ((theCoupon.value * cart.total_price) / 100 >= cart.total_price)
      cart.discounted_price = 0;
    else
      cart.discounted_price =
        cart.total_price - (theCoupon.value * cart.total_price) / 100;

    cart.coupon_applied = theCoupon._id;

    theCoupon.qty -= 1;
    theUser.cart = cart;
    await theUser.save();
    await theCoupon.save();

    await session.commitTransaction();
    res.status(200).json({
      success: true,
      message: 'Code applied',
      data: cart,
    });
  } catch (err) {
    await session.abortTransaction();
    logger.error('Error applying couponse: ', err);
    return next(new errorResponse('Error applying couponse', 500));
  } finally {
    session.endSession();
  }
});

const removeCoupon = asyncHandler(async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { code, cartId } = req.body;
    // const coupon = await Coupon.findOne({ code });

    // if (!coupon) return next(new errorResponse('Invalid code', 400));

    // const cart = await Cart.findById(cartId);
    // if (!cart) return next(new errorResponse('Invalid cart', 404));

    const { data: theCoupon, error: errFetchingCoupon } =
      await Repository.fetchOne(
        {
          modelName: DB_MODELS.coupon,
          query: {
            code,
          },
          t: session,
        },
        logger
      );

    if (errFetchingCoupon) {
      await session.abortTransaction();
      return next(new errorResponse(errFetchingCoupon, 500));
    }

    if (!theCoupon || theCoupon.qty == 0) {
      await session.abortTransaction();
      return next(new errorResponse('Invalid code', 400));
    }

    // const cart = await Cart.findById(cartId);
    const { data: theUser, error: errFetchingUser } =
      await Repository.fetchById(
        {
          modelName: DB_MODELS.user,
          query: {
            id: req.user.id,
          },
          t: session,
        },
        logger
      );

    if (errFetchingUser) {
      await session.abortTransaction();
      return next(new errorResponse(errFetchingUser, 500));
    }

    const cart = theUser.cart;

    if (!cart) {
      await session.abortTransaction();
      return next(new errorResponse('No items in the cart', 404));
    }

    if (!cart.coupon_applied) {
      await session.abortTransaction();
      return next(new errorResponse('No coupon applied', 401));
    }

    cart.discounted_price = null;
    cart.coupon_applied = null;

    theCoupon.qty += 1;
    theUser.cart = cart;
    await theUser.save();
    await theCoupon.save();

    await session.commitTransaction();
    res.status(200).json({
      success: true,
      message: 'Code removed',
      data: cart,
    });
  } catch (err) {
    await session.abortTransaction();
    logger.error('Error removing coupons: ', err);
    return next(new errorResponse('Error removing coupons', 500));
  } finally {
    session.endSession();
  }
});

const myCart = asyncHandler(async (req, res, next) => {
  // let cart = await Cart.findOne({ user: req.user.id }).populate(
  //   'coupon_applied'
  // );
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { data: theUser, error: errFetchingUser } =
      await Repository.fetchById(
        {
          modelName: DB_MODELS.user,
          query: {
            id: req.user.id,
          },
          include: ['coupon_applied'],
          t: session,
        },
        logger
      );

    if (errFetchingUser) {
      await session.abortTransaction();
      return next(new errorResponse(errFetchingUser, 500));
    }

    const cart = theUser.cart;

    let items = [];
    for (let item of cart.items) {
      // const product = await Product.findById(item.product).populate('seller');

      const { data: product, error: errFetchingProduct } =
        await Repository.fetchById(
          {
            modelName: DB_MODELS.product,
            query: {
              id: item.product,
            },
            include: ['seller'],
            t: session,
          },
          logger
        );

      if (errFetchingProduct) {
        await session.abortTransaction();
        return next(new errorResponse(errFetchingProduct, 500));
      }

      const productObj = {
        _id: product._id,
        title: product.title,
        condition: product.condition,
        color: product.color,
        cost: product.cost,
        images: product.images,
        tags: product.tags,
        qty: item.qty,
      };

      const sellerObj = {
        first_name: product.seller.first_name,
        last_name: product.seller.last_name,
        username: product.seller.username,
        _id: product.seller._id,
      };

      let isAdded = false;
      for (let elem of items) {
        if (elem.seller.username == sellerObj.username) {
          elem.products.push(productObj);
          isAdded = true;
        }
      }

      if (items.length === 0 || !isAdded)
        items.push({
          seller_id: sellerObj._id,
          seller: sellerObj,
          products: [productObj],
        });
    }

    const sendData = {
      _id: cart._id,
      items,
      total_qty: cart.total_qty,
      total_price: cart.total_price,
      discounted_price: cart.discounted_price,
      coupon_applied: cart.coupon_applied
        ? {
            code: cart.coupon_applied.code,
            value: cart.coupon_applied.value,
          }
        : null,
    };

    await session.commitTransaction();
    res.status(200).json({
      success: true,
      cart: sendData,
    });
  } catch (err) {
    await session.abortTransaction();
    logger.error('Error fetching cart: ', err);
    return next(new errorResponse('Error fetching cart', 500));
  } finally {
    session.endSession();
  }
});

module.exports = {
  getItems,
  removeItem,
  applyCoupon,
  removeCoupon,
  myCart,
};
