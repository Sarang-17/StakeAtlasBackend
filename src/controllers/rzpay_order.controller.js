const crypto = require('crypto');
const { nanoid } = require('nanoid');
const Razorpay = require('razorpay');
const errorResponse = require('../utils/error.utils');
const asyncHandler = require('../middlewares/async.middleware');
require('dotenv').config();

// Packages
const mongoose = require('mongoose');

// Repository
const Repository = require('../repository/mongoose');

// Model enums
const { DB_MODELS } = require('../utils/modelEnums');
const { USER_ROLE, ORDER_STATUS } = require('../utils/enums');

// Logger
const logger = require('../utils/winston');

const instance = new Razorpay({
  key_id: 'rzp_test_MwRO5Q0p63zWX2',
  key_secret: "",
});

// JOI schema
const { createOrderSchema, verifySignatureSchema } = require('../joi/order');
const { PAYMENT_GATEWAY } = require('../utils/enums');

const createRzpayOrderId = asyncHandler(async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const joiValidation = createOrderSchema.validate(req.body);
    if (joiValidation.error) {
      await session.abortTransaction();
      return next(
        new errorResponse(joiValidation.error.details[0].message, 400)
      );
    }

    const { productId, addressId, taxPrice, shippingPrice } = req.body;
    let orderItems = {};
    let itemsPrice = 0;
    if (productId) {
      const { data: fetchedProduct, error: errFetchingProducts } =
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

      if (errFetchingProducts) {
        await session.abortTransaction();
        logger.error('Error fetching products: ', errFetchingProducts);
        return next(new errorResponse('Error creating order ', 500));
      }

      if (fetchedProduct.status.state != 'Active')
        return next(new errorResponse('Product not active', 401));

      orderItems = {
        product: fetchedProduct._id,
        qty: 1,
      };
      if (fetchedProduct.discount)
        itemsPrice =
          fetchedProduct.cost -
          (fetchedProduct.discount * fetchedProduct.cost) / 100;
      else itemsPrice = fetchedProduct.cost;
    } else {
      // const cart = await Cart.findOne({ user: req.user.id });
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

      const userCart = theUser.cart;

      if (!userCart || userCart.items.length == 0) {
        await session.abortTransaction();
        return next(new errorResponse('Please add items in the cart', 404));
      }

      orderItems = userCart.items;
      itemsPrice = userCart.coupon_applied
        ? userCart.discounted_price
        : userCart.total_price;
    }
    const amount = itemsPrice + taxPrice + shippingPrice;
    const userId = req.user.id;
    const receipt = await nanoid();

    const options = {
      amount: amount * 100, // amount in the smallest currency unit
      currency: 'INR',
      receipt: receipt,
    };
    const order = await instance.orders.create(options);
    const createObject = {
      payment_gateway_order_id: order.id,
      payment_gateway: PAYMENT_GATEWAY.RAZORPAY,
      amount: amount,
      user: userId,
      order_items: orderItems,
      items_price: itemsPrice,
      tax_price: taxPrice,
      shipping_price: shippingPrice,
      shipping: addressId,
    };

    const { data: createdOrder, error: errCreatingOrder } =
      await Repository.create(
        {
          modelName: DB_MODELS.order,
          createObject,
          t: session,
        },
        logger
      );

    if (errCreatingOrder) {
      await session.abortTransaction();
      return next(new errorResponse('Error creating order', 500));
    }

    await session.commitTransaction();
    return res.status(200).json({
      success: true,
      data: order,
    });
  } catch (err) {
    await session.abortTransaction();
    logger.error('Error creating orders: ', err);
    return next(new errorResponse(`Error creating orders: ${err}`, 500));
  } finally {
    session.endSession();
  }
});

const myOrder = asyncHandler(async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { select, sort, page, limit } = req.query;

    const { data: fetchedOrders, error: errFetchingOrders } =
      await Repository.fetchAll(
        {
          modelName: DB_MODELS.order,
          query: {
            user: req.user.id,
          },
          include: ['order_items.product'],
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

    if (errFetchingOrders) {
      await session.abortTransaction();
      logger.error('Error fetching orders: ', errFetchingOrders);
      return next(new errorResponse('Error fetching orders ', 500));
    }

    await session.commitTransaction();
    return res.status(200).json({
      success: true,
      count: fetchedOrders.length,
      data: fetchedOrders,
    });
  } catch (err) {
    await session.abortTransaction();
    logger.error('Error fetching orders: ', err);
    return next(new errorResponse(`Error fetching orders: ${err}`, 500));
  } finally {
    session.endSession();
  }
});

const allOrders = asyncHandler(async (req, res, next) => {
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

    const { data: fetchedOrders, error: errFetchingOrders } =
      await Repository.fetchAll(
        {
          modelName: DB_MODELS.order,
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

    if (errFetchingOrders) {
      await session.abortTransaction();
      logger.error('Error fetching orders: ', errFetchingOrders);
      return next(new errorResponse('Error fetching orders ', 500));
    }

    await session.commitTransaction();
    res.status(200).json({
      success: true,
      count: fetchedOrders.count,
      data: fetchedOrders,
    });
  } catch (err) {
    await session.abortTransaction();
    logger.error('Error fetching orders: ', err);
    return next(new errorResponse(`Error fetching orders: ${err}`, 500));
  } finally {
    session.endSession();
  }
});

const verifySignature = asyncHandler(async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const joiValidation = verifySignatureSchema.validate(req.body);
    if (joiValidation.error) {
      await session.abortTransaction();
      return next(
        new errorResponse(joiValidation.error.details[0].message, 400)
      );
    }

    const { razorpayOrderId, razorpayPaymentId, razorpaySignature } = req.body;
    const userId = req.user.id;
    let amount = 0;
    const hmac = crypto.createHmac('sha256', process.env.RAZORPAY_SECRET);
    hmac.update(razorpayOrderId + '|' + razorpayPaymentId);
    let generatedSignature = hmac.digest('hex');

    let isSignatureValid = generatedSignature == razorpaySignature;

    logger.info('Is signature valid: ', isSignatureValid);

    if (isSignatureValid) {
      // let user = await User.findOne({
      //   _id: userId,
      // });
      // let paid = false;

      const { data: existingOrder, error: errExistingOrder } =
        await Repository.fetchOne(
          {
            modelName: DB_MODELS.order,
            query: {
              payment_gateway_order_id: razorpayOrderId,
              payment_gateway: PAYMENT_GATEWAY.RAZORPAY,
            },
            t: session,
          },
          logger
        );

      if (errExistingOrder) {
        await session.abortTransaction();
        return next();
      }

      amount = existingOrder.amount;
      if (existingOrder && existingOrder.status == ORDER_STATUS.UNPAID) {
        existingOrder.status = ORDER_STATUS.PAID;
        existingOrder.paid = true;
        existingOrder.paid_at = new Date();

        // Clearing cart on success payment
        // const theCart = await Cart.findOne({ user: userId });
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

        const userCart = theUser.cart;

        userCart.items = [];
        userCart.total_price = 0;
        userCart.total_qty = 0;
        userCart.discounted_price = null;
        userCart.coupon_applied = null;

        theUser.cart = userCart;
        await theUser.save();
        // await userCart.save();
        await existingOrder.save();
        await session.commitTransaction();
        return res.status(200).json({
          success: true,
          message: 'Order Placed, payment status paid',
        });
      } else return next(new errorResponse('Order already paid', 401));
    } else return next(new errorResponse('Signature invalid', 401));
  } catch (err) {
    await session.abortTransaction();
    logger.error('Error verifying orders: ', err);
    return next(new errorResponse(`Error verifying orders: ${err}`, 500));
  } finally {
    session.endSession();
  }
});

module.exports = {
  createRzpayOrderId,
  myOrder,
  allOrders,
  verifySignature,
};
