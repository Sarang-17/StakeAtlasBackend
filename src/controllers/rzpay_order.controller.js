const { nanoid } = require('nanoid');
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

// CashFree
const sdk = require('api')('@cashfreedocs-new/v3#9qqu7am5li0449pa');
// sdk.server(process.env.CASHFREE_BASEURL);

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

      if (fetchedProduct.status.state != 'active')
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
    const userId = req.user._id;

    // CASHFREE --------------------
    const orderID = nanoid();
    var order=null;
    let orderCreated=false;
    const options = {
      order_id: `${orderID}`,
      order_amount: amount,
      order_currency: 'INR',
      customer_details: {
        customer_id: userId,
        customer_email: req.user.email,
        customer_phone: req.user.phone
      },
      order_meta: {
        return_url: `${process.env.CASHFREE_REDIRECTURL}?order_id={order_id}`,
        // notify_url: process.env.HOST_URI+"/api/v1/order/notify"
      },
      order_note: `Order initiated at ${Date.now()}`
    };
    await sdk.createOrder(options,
    {
      'x-client-id': process.env.CASHFREE_CLIENTID,
      'x-client-secret': process.env.CASHFREE_CLIENT_SECRET,
      'x-api-version': '2022-09-01'
    })
    .then(({ data }) => { orderCreated=true; order=data; })
    .catch( err => {order=err;logger.info(err);});
    // ------------------------------------

    const createObject = {
      payment_gateway_order_id: order.order_id,
      payment_gateway: PAYMENT_GATEWAY.CASHFREE,
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

    const { orderId } = req.body;
    const userId = req.user.id;
    let amount = 0;
    let isSignatureValid=false;
    await sdk.getStatus({
      'orderId': orderId,
      'appId': process.env.CASHFREE_CLIENTID,
      'secretKey': process.env.CASHFREE_CLIENT_SECRET
    })
    .then(({ data }) => {isSignatureValid=(data.orderStatus=="PAID")})
    .catch(err => {
      logger.error('Cannot fetch order: ', err);
    });
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
              payment_gateway_order_id: orderId,
              payment_gateway: PAYMENT_GATEWAY.CASHFREE,
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
