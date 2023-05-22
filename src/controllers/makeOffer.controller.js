const MakeOffer = require('../models/makeOffer.model');
const asyncHandler = require('../middlewares/async.middleware');
const errorResponse = require('../utils/error.utils');
const sendEmail = require('../utils/sendEmail.utils');
const Cart = require('../models/cart.model');

AcceptOffer = asyncHandler(async (makeOffer) => {
  let cart = await Cart.findOne({ user: makeOffer.user });

  if (!cart) {
    cart = await Cart.create({
      items: [
        {
          product: makeOffer.product,
          qty: 1,
          price:
            makeOffer.min_offer_amount[makeOffer.min_offer_amount.length - 1]
              .amount,
        },
      ],
      totalQty: 1,
      totalPrice:
        makeOffer.min_offer_amount[makeOffer.min_offer_amount.length - 1]
          .amount,
      user: makeOffer.user,
    });
  } else {
    cart.items.push({
      product: makeOffer.product,
      qty: 1,
      price:
        makeOffer.min_offer_amount[makeOffer.min_offer_amount.length - 1]
          .amount,
    });
    cart.totalPrice +=
      makeOffer.min_offer_amount[makeOffer.min_offer_amount.length - 1].amount;
    cart.totalQty += 1;
    await cart.save();
  }
});

const byUser = asyncHandler(async (req, res, next) => {
  let makeOffer;
  if (req.user.role != 'seller') {
    makeOffer = await MakeOffer.findOne({
      user: req.user.id,
      product: req.body.productId,
      status: 'Open',
    });
    if (!makeOffer) {
      req.body.user = req.user.id;
      makeOffer = await MakeOffer.create({
        product: req.body.productId,
        user: req.user.id,
        min_offer_amount: [
          {
            amount: req.body.min_offer_amount,
            by: req.user.role,
          },
        ],
      });

      return res.status(200).json({
        success: true,
        message: 'Offer given',
        data: makeOffer,
      });
    }
  } else {
    makeOffer = await MakeOffer.findById(req.body._id).populate([
      'product',
      'user',
    ]);
    if (!makeOffer) {
      return next(new errorResponse('No offer found for given id', 404));
    }
    if (makeOffer.product.seller != req.user.id) {
      return next(
        new errorResponse('Not authorized to give counter offer', 403)
      );
    }
  }

  if (makeOffer.status != 'Open') {
    return next(new errorResponse(`Offer already ${makeOffer.status}`, 409));
  }
  if (makeOffer.min_offer_amount.length >= 6) {
    return next(new errorResponse('Minimum offer limit exceded', 401));
  }
  if (req.body.status && req.body.status == 'Accepted') {
    if (req.user.role == 'seller') {
      const options = {
        heading: 'Seller has accepted your offer',
        mainmessage: `Congratulations ${makeOffer.user.name}, Your offer has been accepted by Seller`,
        email: makeOffer.user.email,
        subject: `Offer on ${makeOffer.product.title}`,
      };
      sendEmail(options);
    }
    makeOffer.status = 'Accepted';
    await makeOffer.save();
    AcceptOffer(makeOffer);
    return res.status(200).json({
      success: true,
      message: `Offer Accepted by ${req.user.role} and Product added to cart`,
      data: makeOffer,
    });
  } else if (req.body.status && req.body.status == 'Rejected') {
    if (req.user.role == 'seller') {
      const options = {
        heading: 'Seller has rejected your offer',
        mainmessage: `Sorry ${makeOffer.user.name}, Your offer has been rejected by Seller`,
        email: makeOffer.user.email,
        subject: `Offer on ${makeOffer.product.title}`,
      };
      sendEmail(options);
    }
    makeOffer.status = 'Rejected';
    await makeOffer.save();
    return res.status(200).json({
      success: true,
      message: `Offer Rejected by ${req.user.role}`,
      data: makeOffer,
    });
  }
  if (!req.body.min_offer_amount) {
    return next(new errorResponse('Required min_offer_amount', 401));
  }
  makeOffer.min_offer_amount.push({
    amount: req.body.min_offer_amount,
    by: req.user.role,
  });
  await makeOffer.save();
  if (req.user.role == 'seller') {
    const options = {
      heading: 'Seller Made a Counter offer',
      mainmessage: `Hello seller has made a counter offer against your offer for ${makeOffer.product.title} , check it out`,
      email: makeOffer.user.email,
      subject: `Offer on ${makeOffer.product.title}`,
    };
    sendEmail(options);
  }
  res.status(200).json({
    success: true,
    message: `Counter offer given`,
    offer: makeOffer,
  });
});

const bySeller = asyncHandler(async (req, res, next) => {
  let makeOffer = await MakeOffer.findById(req.body._id).populate([
    'product',
    'user',
  ]);
  if (makeOffer.status != 'Open') {
    return next(new errorResponse(`Offer already ${makeOffer.status}`, 409));
  }
  if (!makeOffer) {
    return next(new errorResponse('No offer found for given id', 404));
  }
  if (makeOffer.product.seller != req.user.id) {
    return next(new errorResponse('Not authorized to give counter offer', 403));
  }
  if (makeOffer.min_offer_amount.length >= 6) {
    return next(new errorResponse('Minimum offer limit exceded', 401));
  }
  if (req.body.status && req.body.status == 'Accepted') {
    const options = {
      heading: 'Seller has accepted your offer',
      mainmessage: `Congratulations ${makeOffer.user.name}, Your offer has been accepted by Seller`,
      email: makeOffer.user.email,
      subject: `Offer on ${makeOffer.product.title}`,
    };
    sendEmail(options);
    makeOffer.status = 'Accepted';
    await makeOffer.save();

    AcceptOffer(makeOffer);
    res.status(200).json({
      success: true,
      message: 'Offer Accepted by Seller and product added to cart',
      data: makeOffer,
    });
  } else if (req.body.status && req.body.status == 'Rejected') {
    makeOffer.status = 'Closed';
    await makeOffer.save();
    res.status(200).json({
      success: true,
      message: 'Offer Rejected by Seller',
      data: makeOffer,
    });
  }
  if (!req.body.min_offer_amount) {
    return next(new errorResponse('Required amount', 401));
  }
  makeOffer.min_offer_amount.push({
    amount: req.body.min_offer_amount,
    by: req.user.role,
  });
  await makeOffer.save();
  const options = {
    heading: 'Seller Made a Counter offer',
    mainmessage: `Hello seller has made a counter offer against your offer for ${makeOffer.product.title} , check it out`,
    email: makeOffer.user.email,
    subject: `Offer on ${makeOffer.product.title}`,
  };
  sendEmail(options);
  res.status(200).json({
    success: true,
    message: 'Counter offer to user given',
    makeOffer: makeOffer,
  });
});

const getOffers = asyncHandler(async (req, res, next) => {
  res.status(200).json({
    success: true,
    count: res.advanceResult.count,
    data: res.advanceResult.data,
  });
});

const closeOffers = asyncHandler(async (req, res, next) => {
  const offers = await MakeOffer.find({
    product: req.params.productId,
  }).populate('user');
  if (offers.length == 0) {
    return next(new errorResponse('No offers made', 404));
  }
  let useremails = [];
  for (let i = 0; i < offers.length; i++) {
    if (offers[i].status != 'Closed') {
      offers[i].status = 'Closed';
      useremails.push(offers[i].user.email);
      await offers[i].save();
    }
  }
  if (useremails.length != 0) {
    const options = {
      heading: 'Product Sold out',
      mainmessage:
        'your offers are getting closed, As the product has been sold out',
      email: useremails,
      subject: 'Product Stock',
    };
    sendEmail(options);
  }
  res.status(200).json({
    success: true,
    message: 'Offers closed and mail sent',
  });
});

module.exports = {
  byUser,
  bySeller,
  getOffers,
  closeOffers,
};
