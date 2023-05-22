const joi = require('joi');

const createOrderSchema = joi.object().keys({
  productId: joi.string().optional(),
  addressId: joi.string().required(),
  taxPrice: joi.number().required(),
  shippingPrice: joi.number().required(),
});

const verifySignatureSchema = joi.object().keys({
  razorpayOrderId: joi.string().required(),
  razorpayPaymentId: joi.string().required(),
  razorpaySignature: joi.string().required(),
});

module.exports = {
  createOrderSchema,
  verifySignatureSchema,
};
